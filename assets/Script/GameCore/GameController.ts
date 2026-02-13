import Tile from "../Tile";
import IGameController from "./IGameController";
import TileInputEventType from "../Input/TileInputEventType";
import TileInputEvent from "../Input/TileInputEvent";
import TileColorConfig from "../Config/TileColorConfig";
import IGameModel, {GameEventResult} from "./Models/IGameModel";
import IAnimationView from "./Animations/IAnimationView";
import IFieldView from "./IFieldView";
import INoMovesResolver from "./INoMovesResolver";
import IGameUi from "../UI/IGameUi";
import { BoosterData } from "./Types/BoosterData";

export default class GameController implements IGameController {
    private model: IGameModel = null;
    private ui: IGameUi = null;
    private animationView: IAnimationView = null;
    private fieldView: IFieldView = null;
    private noMovesResolver: INoMovesResolver | null = null;
    private initialField: (string | null)[][] | null = null;
    private isAnimating: boolean = false;

    constructor(model: IGameModel, ui: IGameUi, fieldView: IFieldView, animationView: IAnimationView, noMovesResolver?: INoMovesResolver | null, initialField?: (string | null)[][] | null) {
        this.model = model;
        this.ui = ui;
        this.fieldView = fieldView;
        this.animationView = animationView;
        this.noMovesResolver = noMovesResolver === undefined ? null : noMovesResolver;
        this.initialField = initialField === undefined ? null : initialField;
    }

    init(): void {
        this.model.init(this.initialField);

        this.fieldView.init(this.ui.getRootNode());
        this.fieldView.rebuild(this.model.getBoard());

        this.ensureMovesAvailable(() => {
            this.updateMovesView();
            this.updateScoreView();
        });
    }

    private ensureMovesAvailable(onDone: () => void): void {
        if (!this.noMovesResolver) {
            onDone();
            return;
        }

        const shuffle = (onComplete: () => void) => {
            this.model.shuffleBoard();
            this.fieldView.playShuffleAnimation(this.model.getBoard(), onComplete);
        };

        const step = () => {
            if (this.model.hasAvailableMoves()) {
                onDone();
                return;
            }
            if (!this.noMovesResolver.tryResolve(shuffle, step)) {
                if (this.ui) {
                    this.ui.lose();
                }
                return;
            }
        };

        step();
    }

    getSupportedEvents(): TileInputEventType[] {
        return this.model.getSupportedEvents();
    }

    handleEvent(event: TileInputEvent): void {
        if (this.isAnimating) {
            return;
        }

        const eventResult = this.model.handleEvent(event);
        if (!eventResult) {
            if (event.onComplete) {
                event.onComplete();
            }
            return;
        }

        this.playEventAnimations(eventResult, event.onComplete).catch((error) => {
            console.error("Error in playEventAnimations:", error);
            throw error;
        });
    }

    private async playEventAnimations(eventResult: GameEventResult, onComplete?: () => void): Promise<void> {
        this.isAnimating = true;

        try {
            await this.animationView.playEventAnimations(eventResult, this.fieldView);
            this.updateFieldAfterAnimation();
            this.isAnimating = false;
            this.checkEndGame();
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            this.isAnimating = false;
            throw error;
        }
    }

    private updateFieldAfterAnimation(): void {
        this.fieldView.rebuild(this.model.getBoard());
        this.updateUI();
        this.model.applyGravityAndRefill();
        this.fieldView.rebuild(this.model.getBoard());
    }

    private updateUI(): void {
        this.updateMovesView();
        this.updateScoreView();
    }

    getRemainingMoves(): number {
        return this.model.getRemainingMoves();
    }

    getScore(): number {
        return this.model.getScore();
    }

    getTargetScore(): number {
        return this.model.getTargetScore();
    }

    addMoves(value: number): void {
        this.model.addMoves(value);
        this.updateMovesView();
    }

    isGameEnded(): boolean {
        const targetScore = this.model.getTargetScore();
        if (targetScore <= 0) {
            return false;
        }
        const score = this.model.getScore();
        const remainingMoves = this.model.getRemainingMoves();
        const isWin = score >= targetScore;
        const isLoseByMoves = remainingMoves <= 0 && score < targetScore;
        return isWin || isLoseByMoves;
    }

    getCellAtPosition(worldPos: cc.Vec2): { row: number; col: number } | null {
        const localPos = this.ui.getRootNode().convertToNodeSpaceAR(worldPos);
        if (this.fieldView.getCellAtPosition) {
            return this.fieldView.getCellAtPosition(localPos);
        }
        return null;
    }

    useBooster(boosterId: string, data?: BoosterData, onComplete?: () => void): void {
        const tile = this.getTileFromBoosterData(data);
        const event: TileInputEvent = {
            type: TileInputEventType.Booster,
            tile: tile,
            boosterId: boosterId,
            boosterData: data,
            onComplete: onComplete
        };
        this.handleEvent(event);
    }

    private getTileFromBoosterData(data?: BoosterData): Tile {
        if (data && typeof data === "object" && "row" in data && typeof data.row === "number" && "col" in data && typeof data.col === "number") {
            const tile = this.fieldView.getTile(data.row, data.col);
            if (tile) {
                return tile;
            }
        }
        return {row: -1, col: -1, node: null};
    }


    private checkEndGame(): boolean {
        const gameState = this.getGameState();
        
        if (this.isWin(gameState)) {
            this.handleWin();
            return false;
        }

        if (this.isLoseByMoves(gameState)) {
            this.handleLose();
            return false;
        }

        if (this.isLoseByNoMoves(gameState)) {
            return this.handleLoseByNoMoves();
        }

        return false;
    }

    private getGameState(): { targetScore: number; score: number; remainingMoves: number; hasMovesOnBoard: boolean } {
        return {
            targetScore: this.model.getTargetScore(),
            score: this.model.getScore(),
            remainingMoves: this.model.getRemainingMoves(),
            hasMovesOnBoard: this.model.hasAvailableMoves()
        };
    }

    private isWin(state: { targetScore: number; score: number }): boolean {
        return state.targetScore > 0 && state.score >= state.targetScore;
    }

    private isLoseByMoves(state: { targetScore: number; score: number; remainingMoves: number }): boolean {
        return state.targetScore > 0 && state.score < state.targetScore && state.remainingMoves <= 0;
    }

    private isLoseByNoMoves(state: { targetScore: number; score: number; remainingMoves: number; hasMovesOnBoard: boolean }): boolean {
        return state.targetScore > 0 && 
               state.score < state.targetScore && 
               state.remainingMoves > 0 && 
               !state.hasMovesOnBoard;
    }

    private handleWin(): void {
        if (this.ui) {
            this.ui.win();
        }
    }

    private handleLose(): void {
        if (this.ui) {
            this.ui.lose();
        }
    }

    private handleLoseByNoMoves(): boolean {
        if (!this.noMovesResolver) {
            this.handleLose();
            return false;
        }

        this.isAnimating = true;

        const shuffle = this.createShuffleCallback();
        const onShuffleComplete = this.createShuffleCompleteCallback();

        if (this.noMovesResolver.tryResolve(shuffle, onShuffleComplete)) {
            return true;
        }

        this.isAnimating = false;
        this.handleLose();
        return false;
    }

    private createShuffleCallback(): (onComplete: () => void) => void {
        return (onComplete: () => void) => {
            this.model.shuffleBoard();
            this.fieldView.playShuffleAnimation(this.model.getBoard(), () => {
                this.model.applyGravityAndRefill();
                this.fieldView.rebuild(this.model.getBoard());
                this.updateUI();
                this.isAnimating = false;
                onComplete();
            });
        };
    }

    private createShuffleCompleteCallback(): () => void {
        return () => {
            if (!this.model.hasAvailableMoves()) {
                this.checkEndGame();
            }
        };
    }

    private updateMovesView() {
        if (!this.ui) {
            return;
        }
        this.ui.setMoves(this.model.getRemainingMoves());
    }

    private updateScoreView() {
        if (!this.ui) {
            return;
        }
        this.ui.setScore(this.model.getScore(), this.model.getTargetScore());
    }
}


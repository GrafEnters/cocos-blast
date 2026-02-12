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
        });
    }

    private async playEventAnimations(eventResult: GameEventResult, onComplete?: () => void): Promise<void> {
        this.isAnimating = true;

        try {
            await this.animationView.playEventAnimations(eventResult, this.fieldView);

            this.fieldView.rebuild(this.model.getBoard());
            this.updateMovesView();
            this.updateScoreView();
            this.isAnimating = false;
            this.checkEndGame();
            this.model.applyGravityAndRefill();
            this.fieldView.rebuild(this.model.getBoard());
            if (onComplete) {
                onComplete();
            }
        } catch (error) {
            this.isAnimating = false;
            throw error;
        }
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

    useBooster(boosterId: string, data?: any, onComplete?: () => void): void {
        let tile: Tile = null;
        if (data && typeof data.row === "number" && typeof data.col === "number") {
            tile = this.fieldView.getTile(data.row, data.col);
        }

        if (!tile) {
            tile = {row: -1, col: -1, node: null} as Tile;
        }

        const event: TileInputEvent = {
            type: TileInputEventType.Booster,
            tile: tile,
            boosterId: boosterId,
            boosterData: data || {},
            onComplete: onComplete
        };
        this.handleEvent(event);
    }


    private checkEndGame() {
        const targetScore = this.model.getTargetScore();
        const score = this.model.getScore();
        const remainingMoves = this.model.getRemainingMoves();
        const hasMovesOnBoard = this.model.hasAvailableMoves();

        const hasTarget = targetScore > 0;
        const isWin = hasTarget && score >= targetScore;
        const isLoseByMoves = hasTarget && score < targetScore && remainingMoves <= 0;
        const isLoseByNoMoves = hasTarget && score < targetScore && remainingMoves > 0 && !hasMovesOnBoard;

        if (isWin) {
            if (this.ui) {
                this.ui.win();
            }
            return;
        }

        if (isLoseByMoves) {
            if (this.ui) {
                this.ui.lose();
            }
            return;
        }

        if (isLoseByNoMoves && this.noMovesResolver) {
            this.isAnimating = true;

            const shuffle = (onComplete: () => void) => {
                this.model.shuffleBoard();
                this.fieldView.playShuffleAnimation(this.model.getBoard(), () => {
                    this.isAnimating = false;
                    onComplete();
                });
            };

            if (this.noMovesResolver.tryResolve(shuffle)) {
                return;
            }

            this.isAnimating = false;
        }

        if (isLoseByNoMoves) {
            if (this.ui) {
                this.ui.lose();
            }
        }
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


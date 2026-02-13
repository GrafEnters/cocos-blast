import BlastGameModel from "../assets/Script/GameCore/Models/BlastGameModel";
import { describe, it } from "./test-runner";

function createModel(rows: number, cols: number, colors: string[], moves: number, targetScore: number, initialField?: (string | null)[][] | null): BlastGameModel {
    const model = new BlastGameModel(rows, cols, colors, moves, targetScore);
    model.init(initialField);
    return model;
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${message}. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
    }
}

function assertTrue(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

function assertFalse(condition: boolean, message: string): void {
    if (condition) {
        throw new Error(message);
    }
}

describe("BlastGameModel", () => {
    describe("calculateGroupScorePublic", () => {
        it("должен возвращать 0 для размера группы 0", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            const score = model.calculateGroupScorePublic(0);
            assertEqual(score, 0, "Очки для группы размера 0 должны быть 0");
        });

        it("должен возвращать правильные очки для группы размера 2", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            const score = model.calculateGroupScorePublic(2);
            assertEqual(score, 4, "Очки для группы размера 2 должны быть 4 (2*2)");
        });

        it("должен возвращать правильные очки для группы размера 5", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            const score = model.calculateGroupScorePublic(5);
            assertEqual(score, 25, "Очки для группы размера 5 должны быть 25 (5*5)");
        });

        it("должен возвращать правильные очки для группы размера 10", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            const score = model.calculateGroupScorePublic(10);
            assertEqual(score, 100, "Очки для группы размера 10 должны быть 100 (10*10)");
        });
    });

    describe("applyScorePublic", () => {
        it("должен увеличивать счет на переданное значение", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            assertEqual(model.getScore(), 0, "Начальный счет должен быть 0");
            
            model.applyScorePublic(10);
            assertEqual(model.getScore(), 10, "Счет должен быть 10 после добавления 10 очков");
            
            model.applyScorePublic(5);
            assertEqual(model.getScore(), 15, "Счет должен быть 15 после добавления еще 5 очков");
        });

        it("не должен увеличивать счет при отрицательном значении", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            model.applyScorePublic(10);
            model.applyScorePublic(-5);
            assertEqual(model.getScore(), 10, "Счет не должен измениться при отрицательном значении");
        });

        it("не должен увеличивать счет при нулевом значении", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            model.applyScorePublic(10);
            model.applyScorePublic(0);
            assertEqual(model.getScore(), 10, "Счет не должен измениться при нулевом значении");
        });

        it("не должен превышать целевой счет", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            model.applyScorePublic(50);
            model.applyScorePublic(60);
            assertEqual(model.getScore(), 100, "Счет не должен превышать целевой счет 100");
        });
    });

    describe("applyGravityAndRefill", () => {
        it("должен опускать тайлы вниз при наличии пустых ячеек", () => {
            const initialField: (string | null)[][] = [
                ["red", null, "green"],
                ["blue", "red", null],
                [null, null, "blue"]
            ];
            const model = createModel(3, 3, ["red", "green", "blue"], 10, 100, initialField);
            
            model.applyGravityAndRefill();
            const board = model.getBoard();
            
            assertTrue(board[2][0] !== null, "Тайл должен упасть вниз в колонке 0");
            assertTrue(board[2][1] !== null, "Тайл должен упасть вниз в колонке 1");
            assertTrue(board[2][2] !== null, "Тайл должен упасть вниз в колонке 2");
        });

        it("должен заполнять пустые ячейки сверху новыми тайлами", () => {
            const initialField: (string | null)[][] = [
                [null, null, null],
                ["red", "green", "blue"],
                ["blue", "red", "green"]
            ];
            const model = createModel(3, 3, ["red", "green", "blue"], 10, 100, initialField);
            
            model.applyGravityAndRefill();
            const board = model.getBoard();
            
            assertTrue(board[0][0] !== null, "Верхняя ячейка должна быть заполнена");
            assertTrue(board[0][1] !== null, "Верхняя ячейка должна быть заполнена");
            assertTrue(board[0][2] !== null, "Верхняя ячейка должна быть заполнена");
        });

        it("должен корректно обрабатывать полностью пустую колонку", () => {
            const initialField: (string | null)[][] = [
                [null, "red", null],
                [null, "green", null],
                [null, "blue", null]
            ];
            const model = createModel(3, 3, ["red", "green", "blue"], 10, 100, initialField);
            
            model.applyGravityAndRefill();
            const board = model.getBoard();
            
            assertTrue(board[0][0] !== null, "Пустая колонка должна быть заполнена");
            assertTrue(board[1][0] !== null, "Пустая колонка должна быть заполнена");
            assertTrue(board[2][0] !== null, "Пустая колонка должна быть заполнена");
        });

        it("не должен изменять доску без пустых ячеек", () => {
            const initialField: (string | null)[][] = [
                ["red", "green", "blue"],
                ["blue", "red", "green"],
                ["green", "blue", "red"]
            ];
            const model = createModel(3, 3, ["red", "green", "blue"], 10, 100, initialField);
            const boardBefore = JSON.parse(JSON.stringify(model.getBoard()));
            
            model.applyGravityAndRefill();
            const boardAfter = model.getBoard();
            
            assertEqual(boardAfter[0][0], boardBefore[0][0], "Доска без пустых ячеек не должна измениться");
            assertEqual(boardAfter[1][1], boardBefore[1][1], "Доска без пустых ячеек не должна измениться");
            assertEqual(boardAfter[2][2], boardBefore[2][2], "Доска без пустых ячеек не должна измениться");
        });
    });

    describe("handleTap - группировка тайлов", () => {
        it("должен находить группу из 2 тайлов одного цвета", () => {
            const initialField: (string | null)[][] = [
                ["red", "red", "green"],
                ["blue", "blue", "green"],
                ["green", "blue", "red"]
            ];
            const model = createModel(3, 3, ["red", "green", "blue"], 10, 100, initialField);
            
            const result = model.handleTap(0, 0);
            
            assertTrue(result !== null, "Результат не должен быть null");
            if (result) {
                assertTrue(result.removed.length >= 2, "Должно быть удалено минимум 2 тайла");
                assertTrue(result.scoreDelta > 0, "Очки должны быть начислены");
            }
        });

        it("не должен обрабатывать клик по одиночному тайлу", () => {
            const initialField: (string | null)[][] = [
                ["red", "green", "blue"],
                ["blue", "red", "green"],
                ["green", "blue", "red"]
            ];
            const model = createModel(3, 3, ["red", "green", "blue"], 10, 100, initialField);
            
            const result = model.handleTap(0, 0);
            
            assertTrue(result === null, "Результат должен быть null для одиночного тайла");
        });

        it("должен находить группу из 4 тайлов одного цвета", () => {
            const initialField: (string | null)[][] = [
                ["red", "red", "red"],
                ["red", "green", "blue"],
                ["green", "blue", "green"]
            ];
            const model = createModel(3, 3, ["red", "green", "blue"], 10, 100, initialField);
            
            const result = model.handleTap(0, 0);
            
            assertTrue(result !== null, "Результат не должен быть null");
            if (result) {
                assertTrue(result.removed.length >= 4, "Должно быть удалено минимум 4 тайла");
                assertEqual(result.scoreDelta, 16, "Очки для группы из 4 тайлов должны быть 16");
            }
        });

        it("должен уменьшать количество оставшихся ходов", () => {
            const initialField: (string | null)[][] = [
                ["red", "red", "green"],
                ["blue", "blue", "green"],
                ["green", "blue", "red"]
            ];
            const model = createModel(3, 3, ["red", "green", "blue"], 10, 100, initialField);
            
            const movesBefore = model.getRemainingMoves();
            model.handleTap(0, 0);
            const movesAfter = model.getRemainingMoves();
            
            assertEqual(movesAfter, movesBefore - 1, "Количество ходов должно уменьшиться на 1");
        });
    });

    describe("isInsidePublic", () => {
        it("должен возвращать true для валидных координат", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            
            assertTrue(model.isInsidePublic(0, 0), "Координаты (0, 0) должны быть валидными");
            assertTrue(model.isInsidePublic(4, 4), "Координаты (4, 4) должны быть валидными");
            assertTrue(model.isInsidePublic(2, 3), "Координаты (2, 3) должны быть валидными");
        });

        it("должен возвращать false для координат за пределами доски", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            
            assertFalse(model.isInsidePublic(-1, 0), "Отрицательная строка должна быть невалидной");
            assertFalse(model.isInsidePublic(0, -1), "Отрицательная колонка должна быть невалидной");
            assertFalse(model.isInsidePublic(5, 0), "Строка за пределами должна быть невалидной");
            assertFalse(model.isInsidePublic(0, 5), "Колонка за пределами должна быть невалидной");
        });
    });
});

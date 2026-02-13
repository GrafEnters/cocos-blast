import { isValidPosition, isValidCellValue, canProcessGameEvent } from "../assets/Script/GameCore/Utils/ValidationUtils";
import BlastGameModel from "../assets/Script/GameCore/Models/BlastGameModel";
import { describe, it } from "./test-runner";

function createModel(rows: number, cols: number, colors: string[], moves: number, targetScore: number): BlastGameModel {
    const model = new BlastGameModel(rows, cols, colors, moves, targetScore);
    model.init();
    return model;
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

describe("ValidationUtils", () => {
    describe("isValidPosition", () => {
        it("должен возвращать true для валидных координат", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            
            assertTrue(isValidPosition(model, 0, 0), "Координаты (0, 0) должны быть валидными");
            assertTrue(isValidPosition(model, 4, 4), "Координаты (4, 4) должны быть валидными");
            assertTrue(isValidPosition(model, 2, 3), "Координаты (2, 3) должны быть валидными");
        });

        it("должен возвращать false для координат за пределами доски", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            
            assertFalse(isValidPosition(model, -1, 0), "Отрицательная строка должна быть невалидной");
            assertFalse(isValidPosition(model, 0, -1), "Отрицательная колонка должна быть невалидной");
            assertFalse(isValidPosition(model, 5, 0), "Строка за пределами должна быть невалидной");
            assertFalse(isValidPosition(model, 0, 5), "Колонка за пределами должна быть невалидной");
        });
    });

    describe("isValidCellValue", () => {
        it("должен возвращать true для непустых строк", () => {
            assertTrue(isValidCellValue("red"), "Строка 'red' должна быть валидной");
            assertTrue(isValidCellValue("green"), "Строка 'green' должна быть валидной");
            assertTrue(isValidCellValue("blue"), "Строка 'blue' должна быть валидной");
        });

        it("должен возвращать false для null", () => {
            assertFalse(isValidCellValue(null), "null не должен быть валидным значением");
        });

        it("должен возвращать false для пустых строк", () => {
            assertFalse(isValidCellValue(""), "Пустая строка не должна быть валидной");
            assertFalse(isValidCellValue("   "), "Строка из пробелов не должна быть валидной");
        });
    });

    describe("canProcessGameEvent", () => {
        it("должен возвращать true когда есть ходы и цель не достигнута", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            
            assertTrue(canProcessGameEvent(model), "Должна быть возможность обработать событие при наличии ходов");
        });

        it("должен возвращать false когда ходы закончились", () => {
            const model = createModel(5, 5, ["red", "green"], 0, 100);
            
            assertFalse(canProcessGameEvent(model), "Не должно быть возможности обработать событие без ходов");
        });

        it("должен возвращать false когда цель достигнута", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 100);
            model.applyScorePublic(100);
            
            assertFalse(canProcessGameEvent(model), "Не должно быть возможности обработать событие после достижения цели");
        });

        it("должен возвращать true когда цель равна 0", () => {
            const model = createModel(5, 5, ["red", "green"], 10, 0);
            model.applyScorePublic(50);
            
            assertTrue(canProcessGameEvent(model), "Должна быть возможность обработать событие при цели равной 0");
        });
    });
});

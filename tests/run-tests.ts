import { printSummary } from "./test-runner";

console.log("Запуск тестов...\n");

import "./BlastGameModel.test";
import "./ValidationUtils.test";

printSummary();

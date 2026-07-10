const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
    "^.+\\.[tj]sx?$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!(@scure|otplib)/)"],
  setupFiles: ["<rootDir>/jest.setup.ts"], // .env.test setup here
};

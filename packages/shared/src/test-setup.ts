// vitest-Setup für standalone `cd packages/shared && npm test`.
// Registriert die @testing-library/jest-dom-Matcher (toBeInTheDocument,
// toHaveClass, …). Beim Lauf via ExamLab-vitest greift stattdessen
// ExamLab/src/test-setup.ts — beide laden jest-dom, daher konsistent.
import '@testing-library/jest-dom'

export interface TestCase {
    input: { list: string[]; live: string[] };
    output: { list: string[]; live: string };
}

export interface JudgeConfig {
    timeout: number;
    tests: TestCase[];
}

export interface JudgeResult {
    avgScore: number;
    judgement: Array<{ score: number; reason: string }>;
}

export type Checker = (
    input: TestCase['input'],
    output: TestCase['output'],
    expected: TestCase['output']
) => { score: number; reason: string };

export function judge(
    program: Buffer | string,
    json: JudgeConfig,
    checker?: Checker | null
): Promise<JudgeResult>;
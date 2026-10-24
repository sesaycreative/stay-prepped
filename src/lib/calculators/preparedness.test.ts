import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  allComplete,
  bandFor,
  calculateScore,
  categoryScore,
  emptyAnswers,
  parseSavedScore,
  type Answer,
  type Answers,
} from './preparedness';

const fill = (v: Answer): Answers => Object.fromEntries(CATEGORIES.map((c) => [c.id, [v, v, v]]));

describe('preparedness: structure', () => {
  it('has 10 categories of 3 questions', () => {
    expect(CATEGORIES).toHaveLength(10);
    for (const c of CATEGORIES) expect(c.questions).toHaveLength(3);
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(10);
  });
});

describe('preparedness: category score', () => {
  it('is points / 9 × 10 to one decimal', () => {
    expect(categoryScore([3, 3, 3])).toBe(10);
    expect(categoryScore([0, 0, 0])).toBe(0);
    expect(categoryScore([1, 0, 0])).toBe(1.1);
    expect(categoryScore([2, 2, 1])).toBe(5.6);
  });
  it('counts unanswered as 0', () => {
    expect(categoryScore([3, null, null])).toBe(3.3);
  });
  it('rejects invalid values', () => {
    expect(() => categoryScore([4 as Answer, 0, 0])).toThrow();
  });
});

describe('preparedness: overall score and bands', () => {
  it('scores all Yes as 100 and all No as 0', () => {
    expect(calculateScore(fill(3)).overall).toBe(100);
    expect(calculateScore(fill(0)).overall).toBe(0);
  });
  it('scores all Partly as 33 and all Mostly as 67', () => {
    expect(calculateScore(fill(1)).overall).toBe(33);
    expect(calculateScore(fill(2)).overall).toBe(67);
  });
  it('is the mean of category scores × 10, rounded', () => {
    const a = fill(0);
    a.food = [3, 3, 3]; // 10
    a.water = [3, 3, 2]; // 8.9
    // mean = 18.9 / 10 = 1.89 → ×10 = 18.9 → 19
    expect(calculateScore(a).overall).toBe(19);
  });
  it('maps band boundaries correctly', () => {
    expect(bandFor(0).label).toBe('Getting started');
    expect(bandFor(39).label).toBe('Getting started');
    expect(bandFor(40).label).toBe('Building');
    expect(bandFor(69).label).toBe('Building');
    expect(bandFor(70).label).toBe('Well prepared');
    expect(bandFor(89).label).toBe('Well prepared');
    expect(bandFor(90).label).toBe('Highly prepared');
    expect(bandFor(100).label).toBe('Highly prepared');
  });
});

describe('preparedness: strengths and gaps', () => {
  it('returns top 3 strengths and gaps', () => {
    const a = fill(1);
    a.food = [3, 3, 3];
    a.water = [3, 3, 2];
    a.supplies = [2, 2, 2];
    a.documents = [0, 0, 0];
    a.financial = [0, 0, 1];
    const r = calculateScore(a);
    expect(r.strengths.map((s) => s.id)).toEqual(['food', 'water', 'supplies']);
    expect(r.gaps.map((g) => g.id).slice(0, 2)).toEqual(['documents', 'financial']);
    expect(r.gaps.every((g) => g.nextStep.length > 10)).toBe(true);
  });
  it('has no strengths when everything is 0 and no gaps when everything is 10', () => {
    expect(calculateScore(fill(0)).strengths).toHaveLength(0);
    expect(calculateScore(fill(3)).gaps).toHaveLength(0);
  });
});

describe('preparedness: completion and saved data', () => {
  it('detects completion', () => {
    expect(allComplete(emptyAnswers())).toBe(false);
    expect(allComplete(fill(2))).toBe(true);
  });
  it('parses valid saved data and rejects invalid data', () => {
    const good = JSON.stringify({ v: 1, savedAt: '2026-10-24T00:00:00Z', answers: fill(2) });
    expect(parseSavedScore(good)?.answers.food).toEqual([2, 2, 2]);
    expect(parseSavedScore(null)).toBeNull();
    expect(parseSavedScore('not json')).toBeNull();
    expect(parseSavedScore(JSON.stringify({ v: 2 }))).toBeNull();
    const bad = fill(2);
    bad.food = [2, 2, 5 as Answer];
    expect(parseSavedScore(JSON.stringify({ v: 1, savedAt: 'x', answers: bad }))).toBeNull();
  });
});

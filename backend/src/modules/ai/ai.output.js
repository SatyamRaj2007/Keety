'use strict';

/**
 * ai.output.js — Output validation and parsing for KEETY AI
 *
 * Per AI.md §52: "Validate: JSON/schema, length, allowed fields, required fields,
 * business constraints, safety constraints. Never trust arbitrary model-generated
 * structured data."
 */

const VALID_PRIORITIES = new Set(['HIGH', 'MEDIUM', 'LOW']);

/**
 * Parse and validate the structured JSON response from Gemini.
 *
 * Returns a validated AIResponse object, or throws if the output is
 * fundamentally unusable.
 *
 * @param {string} rawText - The raw text output from the model
 * @returns {{ answer, insights, recommendations, limitations, dataSource }}
 */
function parseAndValidateOutput(rawText) {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Model returned an empty response');
  }

  // Extract JSON from the response — model may wrap it in markdown code fences
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If JSON parsing fails, treat the entire text as the answer (graceful degradation)
    return {
      answer: rawText.trim().slice(0, 2000),
      insights: [],
      recommendations: [],
      limitations: ['Structured output could not be parsed from the AI response.'],
      dataSource: 'Business analytics'
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Model returned non-object JSON');
  }

  // Validate and sanitise each field
  const answer = typeof parsed.answer === 'string' ? parsed.answer.trim().slice(0, 2000) : '';
  if (!answer) {
    throw new Error('Model response is missing required "answer" field');
  }

  const insights = Array.isArray(parsed.insights)
    ? parsed.insights.slice(0, 5).map((insight) => ({
        title: String(insight?.title || '').trim().slice(0, 120),
        description: String(insight?.description || '').trim().slice(0, 400),
        metric: insight?.metric ? String(insight.metric).trim().slice(0, 60) : undefined,
        value: typeof insight?.value === 'number' ? insight.value : undefined
      })).filter((i) => i.title && i.description)
    : [];

  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations.slice(0, 5).map((rec) => ({
        title: String(rec?.title || '').trim().slice(0, 120),
        description: String(rec?.description || '').trim().slice(0, 400),
        priority: VALID_PRIORITIES.has(rec?.priority) ? rec.priority : 'MEDIUM',
        evidence: rec?.evidence ? String(rec.evidence).trim().slice(0, 300) : undefined
      })).filter((r) => r.title && r.description)
    : [];

  const limitations = Array.isArray(parsed.limitations)
    ? parsed.limitations.slice(0, 5).map((l) => String(l).trim().slice(0, 200)).filter(Boolean)
    : [];

  const dataSource = typeof parsed.dataSource === 'string'
    ? parsed.dataSource.trim().slice(0, 200)
    : 'Business analytics';

  return { answer, insights, recommendations, limitations, dataSource };
}

module.exports = { parseAndValidateOutput };

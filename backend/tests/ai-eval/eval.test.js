'use strict';

/**
 * KEETY AI Evaluation Test Runner
 *
 * AI.md §62–§68: Measures AI quality against the golden dataset.
 * AI.md §67: "Run the benchmark whenever changing model/prompt/context."
 *
 * This test uses a REAL Gemini call (not a mock) so it reflects actual
 * model behaviour. It is skipped automatically when GEMINI_API_KEY is absent
 * to keep CI green without credentials.
 *
 * Run manually:
 *   GEMINI_API_KEY=<key> node --test tests/ai-eval/eval.test.js
 *
 * Output is printed in a readable evaluation report format.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET    = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI   = 'placeholder';

const { startDb, stopDb, clearDb } = require('../helpers/db');
const { makeUserWithBusiness, makeProduct, makeInventory, makeSale } = require('../helpers/factories');
const { cases, evaluateResponse, DATASET_VERSION } = require('./golden-dataset');

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SKIP_EVAL  = !GEMINI_KEY;

if (SKIP_EVAL) {
  test('AI evaluation dataset — SKIPPED (set GEMINI_API_KEY to run)', (t) => {
    t.skip('GEMINI_API_KEY not set — run manually: GEMINI_API_KEY=<key> node --test tests/ai-eval/eval.test.js');
  });
} else {
  // ─── Set env for real Gemini calls ──────────────────────────────────────
  process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  const aiService = require('../../src/modules/ai/ai.service');

  test.before(startDb);
  test.after(stopDb);
  test.beforeEach(clearDb);

  // ─── Run each golden case ────────────────────────────────────────────────

  for (const goldenCase of cases) {
    test(`[${goldenCase.id}] ${goldenCase.category} — ${goldenCase.input.question || '(summary/strategy)'}`, async () => {
      // 1. Build the test fixture ────────────────────────────────────────────
      const { user, business } = await makeUserWithBusiness(
        {},
        goldenCase.fixture.business
      );

      // Create products from fixture
      const createdProducts = [];
      for (const prodDef of (goldenCase.fixture.products || [])) {
        const p = await makeProduct(business._id, prodDef);
        createdProducts.push(p);
      }

      // Create a single inventory record for product analysis cases
      if (goldenCase.fixture.product) {
        const p = await makeProduct(business._id, goldenCase.fixture.product);
        if (goldenCase.fixture.product.inventory) {
          await makeInventory(business._id, p._id, goldenCase.fixture.product.inventory);
        }
        // Inject productId into input for PRODUCT_ANALYSIS cases
        if (goldenCase.requestType === 'PRODUCT_ANALYSIS') {
          goldenCase.input.productId = p._id.toString();
        }
      }

      // Create sales from fixture (simple — uses first created product)
      for (const saleDef of (goldenCase.fixture.sales || [])) {
        if (createdProducts.length > 0) {
          // Map fixture sale items to real product references
          const items = saleDef.items.map((item, idx) => ({
            product: createdProducts[idx] || createdProducts[0],
            quantity: item.quantity || 1
          }));
          await makeSale(business._id, items, { totalAmount: saleDef.totalAmount });
        }
      }

      // 2. Call the appropriate AI service handler ───────────────────────────
      let aiResponse;
      const { period } = goldenCase.input;

      try {
        switch (goldenCase.requestType) {
          case 'ASK':
            aiResponse = await aiService.ask(business, user, goldenCase.input.question, period);
            break;
          case 'GROWTH_STRATEGY':
            aiResponse = await aiService.growthStrategy(business, user, goldenCase.input.goal, period);
            break;
          case 'PRODUCT_ANALYSIS':
            aiResponse = await aiService.productAnalysis(
              business, user,
              goldenCase.input.productId,
              goldenCase.input.question,
              period
            );
            break;
          case 'SUMMARY':
            aiResponse = await aiService.businessSummary(business, user, period);
            break;
          default:
            throw new Error(`Unknown requestType: ${goldenCase.requestType}`);
        }
      } catch (err) {
        // AI service errors are hard failures — provider unavailable etc.
        assert.fail(`AI service threw: ${err.message}`);
      }

      // 3. Evaluate response against golden expectations ─────────────────────
      const { pass, failures } = evaluateResponse(goldenCase, aiResponse);

      if (!pass) {
        console.log(`\n  ❌ ${goldenCase.id} FAILED`);
        console.log(`     Answer: ${(aiResponse.answer || '').slice(0, 200)}`);
        console.log(`     Limitations: ${(aiResponse.limitations || []).join('; ')}`);
        failures.forEach((f) => console.log(`     • ${f}`));
      }

      assert.ok(pass, `[${goldenCase.id}] Evaluation failures:\n  ${failures.join('\n  ')}`);
    });
  }

  // ─── Summary report ───────────────────────────────────────────────────────
  test.after(() => {
    console.log(`\n  ✅ KEETY AI Evaluation — Dataset v${DATASET_VERSION} — ${cases.length} cases`);
  });
}

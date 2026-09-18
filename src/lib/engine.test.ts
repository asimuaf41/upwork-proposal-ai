import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeJob } from "./analyze-job";
import { composeBoost, composeProposal, looksLikeBannedOpener } from "./compose-proposal";
import { generateProposal } from "./generate";
import { SAMPLE_JOBS } from "./samples";
import { wordCount } from "./word-count";

describe("analyzeJob", () => {
  it("extracts a filter word from 'start your proposal with'", () => {
    const analysis = analyzeJob(SAMPLE_JOBS[0].text);
    assert.equal(analysis.filterWord, "RADIOLOGY");
    assert.equal(analysis.jobType, "ai-agent");
    assert.equal(analysis.fit, "strong");
    assert.equal(analysis.asksForRate, true);
    assert.equal(analysis.isLongTerm, true);
  });

  it("flags Laravel-only jobs as skip", () => {
    const analysis = analyzeJob(
      "Looking for a Laravel PHP developer to build a CMS. Must have 5 years Laravel. No React.",
    );
    assert.equal(analysis.fit, "skip");
  });

  it("treats React Native as partial when web stack is also present", () => {
    const analysis = analyzeJob(
      "Need a Next.js and React developer. React Native nice to have for a later mobile wrap.",
    );
    assert.ok(analysis.fit === "strong" || analysis.fit === "partial");
  });

  it("does not treat a short field-service post as vague", () => {
    const analysis = analyzeJob(SAMPLE_JOBS[2].text);
    assert.equal(analysis.isVague, false);
    assert.equal(analysis.jobType, "field-service");
  });
});

describe("composeProposal", () => {
  it("follows the rules on the AI sample", async () => {
    const result = await generateProposal(SAMPLE_JOBS[0].text, {
      provider: "local",
    });
    assert.ok(result.proposal.startsWith("RADIOLOGY"));
    assert.equal(looksLikeBannedOpener(result.proposal, "RADIOLOGY"), false);
    assert.ok(!/^I\b/m.test(result.proposal.split("\n").filter(Boolean)[1] ?? ""));
    assert.ok(result.proposal.includes("https://ai-agent-platform-nextjs.vercel.app"));
    assert.ok(result.proposal.includes("https://github.com/asimuaf41"));
    assert.ok(!/upwork\.com/i.test(result.proposal));
    assert.ok(!/hi, my name is/i.test(result.proposal));
    assert.ok(result.proposal.includes("— "));
    assert.ok(result.wordCount <= 350);
    assert.ok(result.proposal.includes("**"));
    assert.ok(/\$45/.test(result.proposal) || /45–55/.test(result.proposal) || /45-55/.test(result.proposal));
  });

  it("stays under 350 words on all samples", () => {
    for (const sample of SAMPLE_JOBS) {
      const analysis = analyzeJob(sample.text);
      const proposal = composeProposal(analysis);
      assert.ok(
        wordCount(proposal) <= 350,
        `${sample.id} was ${wordCount(proposal)} words`,
      );
      assert.ok(proposal.includes("Top Rated Plus"));
      assert.ok(proposal.includes("small paid milestone"));
    }
  });

  it("does not offer free work or discounts", () => {
    const proposal = composeProposal(analyzeJob(SAMPLE_JOBS[1].text));
    assert.ok(!/\bfree\b/i.test(proposal));
    assert.ok(!/discount/i.test(proposal));
    assert.ok(/How do you take over/i.test(proposal));
  });

  it("writes a skip note instead of a Next.js bid for Laravel jobs", () => {
    const proposal = composeProposal(
      analyzeJob(
        "Looking for a Laravel PHP developer to build a CMS. Must have 5 years Laravel. No React.",
      ),
    );
    assert.ok(proposal.startsWith("Do not apply."));
    assert.ok(!/app\.ourmethod\.com/.test(proposal));
    assert.ok(!/Happy to start with a small paid milestone/.test(proposal));
  });

  it("does not duplicate field service in the opening", () => {
    const proposal = composeProposal(analyzeJob(SAMPLE_JOBS[2].text));
    assert.ok(!/field service field service/i.test(proposal));
    assert.ok(/dispatcher|technician|OptiField/i.test(proposal));
  });

  it("keeps boost messages short", () => {
    const boost = composeBoost(analyzeJob(SAMPLE_JOBS[0].text));
    assert.ok(wordCount(boost.message) < 120);
    assert.ok(!boost.message.includes("upwork.com"));
  });
});

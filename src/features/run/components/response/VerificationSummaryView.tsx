import { useId } from "react";
import type { SolutionVerificationSummary } from "@/shared/contracts/browser_run_v1";
import {
  COVERAGE_DESCRIPTIONS,
  COVERAGE_LABELS,
  VERIFICATION_SUMMARY_TITLE,
} from "./response_labels";

interface VerificationSummaryViewProps {
  summaries: SolutionVerificationSummary[];
}

/**
 * 검증 요약. direct와 supporting을 다른 문구로 보이고 supporting은 완전한 정답 보장으로 쓰지 않는다.
 * solution·claim id는 보이지 않는다.
 */
export const VerificationSummaryView = ({
  summaries,
}: VerificationSummaryViewProps) => {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="rounded-[10px] bg-[#F7F9FC] px-3 py-2 text-[13px]"
    >
      <h3
        id={titleId}
        className="text-[13px] font-semibold"
      >
        {VERIFICATION_SUMMARY_TITLE}
      </h3>
      <ul className="mt-1 flex flex-col gap-2">
        {summaries.map((summary, summaryIndex) => (
          <li
            key={summary.solutionId}
            data-coverage={summary.overallCoverage}
          >
            <p className="font-medium">
              {summaries.length > 1 && `풀이 ${summaryIndex + 1} · `}
              {COVERAGE_LABELS[summary.overallCoverage]}
            </p>
            <p className="text-[#4A5A78]">
              {COVERAGE_DESCRIPTIONS[summary.overallCoverage]}
            </p>
            {summary.claims.length > 0 && (
              <ul className="mt-1 flex flex-col gap-1 pl-3">
                {summary.claims.map((claim) => (
                  <li
                    key={claim.claimId}
                    data-coverage={claim.coverage}
                  >
                    <span>
                      {COVERAGE_LABELS[claim.coverage]}: {claim.methodLabel}
                    </span>
                    {!!claim.unconfirmedSteps?.length && (
                      <ul className="pl-3 text-[#80661C]">
                        {claim.unconfirmedSteps.map((step) => (
                          <li key={step.stepId}>
                            확인되지 않은 단계: {step.reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

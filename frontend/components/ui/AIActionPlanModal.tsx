import React, { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import StatusBadge from "./StatusBadge";
import { CheckCircle2, Sparkles, ArrowRight, Clock, AlertCircle } from "lucide-react";

export interface AIPlanStep {
  id: number;
  label: string;
  detail: string;
  status?: "pending" | "executing" | "completed";
}

interface AIActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  trigger: string;
  userRequest?: string;
  steps?: AIPlanStep[];
  actions?: string[];
  onExecute: () => Promise<void> | void;
}

export const AIActionPlanModal: React.FC<AIActionPlanModalProps> = ({
  isOpen,
  onClose,
  title,
  trigger,
  userRequest = "User triggered automated workflow plan",
  steps: initialSteps,
  actions,
  onExecute
}) => {
  const [stage, setStage] = useState<"review" | "executing" | "completed">("review");
  const normalizedSteps: AIPlanStep[] =
    initialSteps ||
    (actions
      ? actions.map((act, i) => ({
          id: i + 1,
          label: act,
          detail: act,
          status: "pending"
        }))
      : []);
  const [steps, setSteps] = useState<AIPlanStep[]>(normalizedSteps);

  const handleRunExecution = async () => {
    setStage("executing");

    // Animate execution through steps
    for (let i = 0; i < steps.length; i++) {
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "executing" } : s
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "completed" } : s
        )
      );
    }

    try {
      await onExecute();
    } catch (e) {
      console.error(e);
    }

    setStage("completed");
  };

  const handleResetAndClose = () => {
    setStage("review");
    setSteps(normalizedSteps);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>{title}</span>
        </div>
      }
      subtitle="AI Proposed Workflow & Action Plan"
      maxWidth="lg"
      footer={
        stage === "completed" ? (
          <Button variant="primary" onClick={handleResetAndClose}>
            Done
          </Button>
        ) : stage === "executing" ? (
          <Button variant="primary" loading disabled>
            Executing Plan...
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleResetAndClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRunExecution}>
              Execute Plan
            </Button>
          </div>
        )
      }
    >
      {stage === "completed" ? (
        <div className="py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Action Executed Successfully!
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            The changes have been applied to your live environment and synchronized across your connected channels.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* User Request Context */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              User Request
            </div>
            <p className="text-xs font-medium text-slate-800 italic">
              "{userRequest}"
            </p>
          </div>

          {/* Trigger */}
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50/60 border border-blue-100 rounded-lg">
            <span className="text-xs font-semibold text-blue-900">
              Trigger: {trigger}
            </span>
            <StatusBadge status="Ready" variant="active" pulse={false} />
          </div>

          {/* Action Steps */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">
              Action Execution Plan:
            </div>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    step.status === "completed"
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                      : step.status === "executing"
                      ? "bg-blue-50/50 border-blue-300 text-blue-900 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      step.status === "completed"
                        ? "bg-emerald-600 text-white"
                        : step.status === "executing"
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">{step.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {step.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AIActionPlanModal;

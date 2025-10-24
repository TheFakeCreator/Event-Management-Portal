'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent } from './card';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface MultiStepFormStep {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  component: React.ReactNode;
}

interface MultiStepFormProps {
  steps: MultiStepFormStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onCancel?: () => void;
  className?: string;
  showProgressBar?: boolean;
  showStepNumbers?: boolean;
  allowSkip?: boolean;
  canGoBack?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  completeButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  error?: string;
  // Validation functions for each step
  stepValidators?: Record<string, () => boolean | Promise<boolean>>;
  // Called when step changes to save form state
  onStepSave?: (stepId: string, data: any) => void;
}

interface StepIndicatorProps {
  step: MultiStepFormStep;
  index: number;
  currentStep: number;
  isCompleted: boolean;
  showNumbers?: boolean;
  onClick?: () => void;
  canNavigate?: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  index,
  currentStep,
  isCompleted,
  showNumbers = true,
  onClick,
  canNavigate = false,
}) => {
  const stepNumber = index + 1;
  const isCurrent = currentStep === index;
  const isPast = currentStep > index;

  return (
    <div className="flex items-center">
      <div
        className={cn(
          'flex items-center cursor-pointer',
          canNavigate && (isPast || isCurrent)
            ? 'cursor-pointer'
            : 'cursor-default'
        )}
        onClick={canNavigate && (isPast || isCurrent) ? onClick : undefined}
      >
        {/* Step Circle */}
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
            isCurrent && 'border-primary bg-primary text-primary-foreground',
            isPast && 'border-primary bg-primary text-primary-foreground',
            !isCurrent &&
              !isPast &&
              'border-muted-foreground text-muted-foreground',
            isCompleted && 'border-green-500 bg-green-500 text-white'
          )}
        >
          {isCompleted ? (
            <Check className="w-4 h-4" />
          ) : showNumbers ? (
            <span className="text-sm font-medium">{stepNumber}</span>
          ) : (
            <div className="w-2 h-2 rounded-full bg-current" />
          )}
        </div>

        {/* Step Label */}
        <div className="ml-3 min-w-0 flex-1">
          <p
            className={cn(
              'text-sm font-medium',
              isCurrent && 'text-primary',
              isPast && 'text-foreground',
              !isCurrent && !isPast && 'text-muted-foreground'
            )}
          >
            {step.title}
            {step.optional && (
              <span className="ml-1 text-xs text-muted-foreground">
                (Optional)
              </span>
            )}
          </p>
          {step.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  className,
  showProgressBar = true,
  showStepNumbers = true,
  allowSkip = false,
  canGoBack = true,
  nextButtonText = 'Next',
  backButtonText = 'Back',
  completeButtonText = 'Complete',
  cancelButtonText = 'Cancel',
  isLoading = false,
  error,
  stepValidators = {},
  onStepSave,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canMoveNext = currentStep < steps.length - 1;
  const canMovePrevious = canGoBack && currentStep > 0;

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const stepId = currentStepData?.id;
    if (!stepId || !stepValidators[stepId]) return true;

    try {
      const isValid = await stepValidators[stepId]();
      if (isValid) {
        setStepErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[currentStep];
          return newErrors;
        });
      }
      return isValid;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Validation failed';
      setStepErrors((prev) => ({ ...prev, [currentStep]: errorMessage }));
      return false;
    }
  }, [currentStepData?.id, stepValidators, currentStep]);

  const handleNext = async () => {
    if (isLoading) return;

    // Validate current step before proceeding
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    // Save step data if handler provided
    if (onStepSave && currentStepData) {
      onStepSave(currentStepData.id, {});
    }

    // Mark step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]));

    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (canMovePrevious && !isLoading) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = async (targetStep: number) => {
    if (isLoading) return;

    // Can only navigate to previous steps or next step if current is completed
    const canNavigate =
      targetStep < currentStep ||
      (targetStep === currentStep + 1 && completedSteps.has(currentStep));

    if (canNavigate) {
      onStepChange(targetStep);
    }
  };

  const handleSkip = () => {
    if (allowSkip && currentStepData?.optional && !isLoading) {
      if (isLastStep) {
        onComplete();
      } else {
        onStepChange(currentStep + 1);
      }
    }
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Progress Bar */}
      {showProgressBar && (
        <div className="mb-8">
          <ProgressBar
            currentStep={currentStep}
            totalSteps={steps.length}
            completedSteps={completedSteps}
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
        </div>
      )}

      {/* Steps Indicator */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {steps.map((step, index) => (
            <StepIndicator
              key={step.id}
              step={step}
              index={index}
              currentStep={currentStep}
              isCompleted={completedSteps.has(index)}
              showNumbers={showStepNumbers}
              onClick={() => handleStepClick(index)}
              canNavigate={true}
            />
          ))}
        </div>
      </div>

      {/* Error Display */}
      {(error || stepErrors[currentStep]) && (
        <Card className="border-destructive bg-destructive/10 mb-6">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">
              {error || stepErrors[currentStep]}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Step Content */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          {currentStepData ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  {currentStepData.title}
                </h2>
                {currentStepData.description && (
                  <p className="text-muted-foreground">
                    {currentStepData.description}
                  </p>
                )}
              </div>

              {currentStepData.component}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Invalid step</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              {cancelButtonText}
            </Button>
          )}

          {canMovePrevious && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {backButtonText}
            </Button>
          )}
        </div>

        <div className="flex space-x-3">
          {allowSkip && currentStepData?.optional && !isLastStep && (
            <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
              Skip
            </Button>
          )}

          <Button
            onClick={handleNext}
            loading={isLoading}
            loadingText={isLastStep ? 'Completing...' : 'Processing...'}
            className="min-w-24"
          >
            {isLastStep ? (
              completeButtonText
            ) : (
              <>
                {nextButtonText}
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing multi-step form state
export const useMultiStepForm = (
  steps: MultiStepFormStep[],
  initialStep = 0
) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < steps.length) {
        setCurrentStep(step);
      }
    },
    [steps.length]
  );

  const markStepComplete = useCallback((stepId: string) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  }, []);

  const updateStepData = useCallback((stepId: string, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], ...data },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setCurrentStep(initialStep);
    setFormData({});
    setCompletedSteps(new Set());
  }, [initialStep]);

  return {
    currentStep,
    formData,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
    markStepComplete,
    updateStepData,
    resetForm,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    totalSteps: steps.length,
    progress: ((currentStep + 1) / steps.length) * 100,
  };
};

export type { MultiStepFormStep, MultiStepFormProps };

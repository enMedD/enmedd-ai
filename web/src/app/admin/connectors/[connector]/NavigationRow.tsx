import { Button } from "@/components/ui/button";
import { useFormContext } from "@/context/FormContext";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { FiPlus } from "react-icons/fi";

const NavigationRow = ({
  noAdvanced,
  noCredentials,
  activatedCredential,
  onSubmit,
  isValid,
}: {
  isValid: boolean;
  onSubmit: () => void;
  noAdvanced: boolean;
  noCredentials: boolean;
  activatedCredential: boolean;
}) => {
  const { formStep, prevFormStep, nextFormStep } = useFormContext();

  return (
    <div className="mt-5 w-full grid md:grid-cols-3 gap-4 items-start">
      {((formStep > 0 && !noCredentials) || (formStep > 1 && !noAdvanced)) && (
        <div>
          <Button
            onClick={prevFormStep}
            variant="outline"
            className="w-full md:w-auto"
          >
            <ArrowLeft />
            Previous
          </Button>
        </div>
      )}

      {(formStep > 0 || noCredentials) && (
        <div className="flex justify-center">
          <Button
            disabled={!isValid}
            onClick={onSubmit}
            type="submit"
            className="w-full md:w-auto"
          >
            Create Connector
            <FiPlus className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        {formStep === 0 && (
          <Button
            disabled={!activatedCredential}
            onClick={() => nextFormStep()}
            className="w-full md:w-auto"
          >
            Continue
            <ArrowRight />
          </Button>
        )}
        {!noAdvanced && formStep === 1 && (
          <Button
            disabled={!isValid}
            onClick={() => nextFormStep()}
            variant="outline"
            className="w-full md:w-auto"
          >
            Advanced
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
};
export default NavigationRow;

/* onMouseDown={() => !disabled && onClick()} */

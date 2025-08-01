import './PrimaryButton.css';
import { Button } from "react-bootstrap";

interface PrimaryButtonProps {
    text: string;
    action: () => void;
}

function PrimaryButton({ text, action }: PrimaryButtonProps) {
    return (
        <div className="primary-button">
            <Button className="primary-button-component" size="lg" onClick={action}>
                {text}
            </Button>
        </div>
    );
}

export default PrimaryButton;

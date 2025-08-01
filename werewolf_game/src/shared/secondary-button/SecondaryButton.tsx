import './SecondaryButton.css';
import { Button } from "react-bootstrap";

interface SecondaryButtonProps {
    text: string;
    action: () => void;
}

function SecondaryButton({ text, action }: SecondaryButtonProps) {
    return (
        <div className="secondary-button">
            <Button className="secondary-button-component" size="lg" onClick={action}>
                {text}
            </Button>
        </div>
    );
}

export default SecondaryButton;

import './HomePage.css'
import { Container, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import PrimaryButton from "../../shared/primary-button/PrimaryButton";
import SecondaryButton from "../../shared/secondary-button/SecondaryButton";
import placeholder from "../../assets/placeholder.jpg"

function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <Container className="home-container">
                <img src={placeholder} alt="Werewolf game logo" className="home-logo mb-4" />

                <h1 className="home-title">Werewolf game</h1>
                <p className="home-subtitle fs-5 text-light">
                    [Game description comming soon !]
                </p>

                <div className="game-buttons">
                    <PrimaryButton text="Create Game" action={() => navigate("/create")} />
                    <SecondaryButton text="Join Game" action={() => navigate("/join")} />
                </div>

                <Card className="rules-card shadow-sm">
                    <Card.Header className="rules-header">Game rules</Card.Header>
                    <Card.Body>
                        <p>
                            [Game rules comming soon !]
                        </p>
                        <p className="text-secondary small">
                            Local version designed for simple, quick and immersives games.
                        </p>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}

export default HomePage;

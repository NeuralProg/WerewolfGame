import './RoleCard.css'
import {Button, Card, ButtonGroup} from "react-bootstrap";

import placeholder from "../../../../assets/placeholder.jpg";

interface RoleCardProps {
    idx: number;
    roles: string[];
    rolesMax: number[];
    activeRoles: number[];
    editRoleCount: (idx: number, delta: number) => void;
    maxNbPlayers: number;
}

function RoleCard({ idx, roles, rolesMax, activeRoles, editRoleCount, maxNbPlayers }: RoleCardProps) {
    const nbPlayers = activeRoles.reduce((acc, value) => acc + value, 0);
    const roleName = roles[idx];
    const currentCount = activeRoles[idx];
    const maxCount = rolesMax[idx];

    if (idx < 0 || idx >= roles.length)
        return;
    return (
        <div className="role-card">
            <Card className="role-card-component text-center">
                <Card.Img variant="top" src={placeholder} alt={roleName} />
                <Card.Body>
                    <Card.Title>{roleName}</Card.Title>
                    <ButtonGroup aria-label={`${roleName} count controls`}>
                        <Button className="card-button" onClick={() => editRoleCount(idx, -1)}
                                disabled={currentCount <= 0}>-</Button>
                        <Button className="card-amount" variant="light" disabled>{activeRoles[idx]}</Button>
                        <Button className="card-button" onClick={() => editRoleCount(idx, 1)}
                                disabled={currentCount >= maxCount || nbPlayers >= maxNbPlayers}>+</Button>
                    </ButtonGroup>
                </Card.Body>
            </Card>
        </div>
    )
}

export default RoleCard;
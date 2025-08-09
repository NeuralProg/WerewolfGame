import './RoleReveal.css'
import { socket } from '../../shared/socket-server/socket';

function RoleReveal() {
    //socket.emit("get-role", ...
    return (
        <div className="RoleReveal">
            <h1>RoleReveal</h1>
            <h4>Role card (img)</h4>
            <h4>Role Name</h4>
            <h4>Role Quick Description</h4>
        </div>
    )
}

export default RoleReveal;
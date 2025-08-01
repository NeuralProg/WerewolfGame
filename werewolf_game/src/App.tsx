import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'

import Home from './pages/homepage/HomePage';
import CreateGame from "./pages/create-game/CreateGame";
import JoinGame from "./pages/join-game/JoinGame";
import Lobby from "./pages/lobby/Lobby";
import RoleReveal from "./pages/role-reveal/RoleReveal";
import NightPhase from "./pages/night-phase/NightPhase";
import DayPhase from "./pages/day-phase/DayPhase";
import DisplayResults from "./pages/display-results/DisplayResults";

function App() {
  return (
      <Router>
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateGame />} />
              <Route path="/join" element={<JoinGame />} />
              <Route path="/lobby/:roomId" element={<Lobby />} />
              <Route path="/role/:roomId" element={<RoleReveal />} />
              <Route path="/night/:roomId" element={<NightPhase />} />
              <Route path="/day/:roomId" element={<DayPhase />} />
              <Route path="/end/:roomId" element={<DisplayResults />} />
              <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </Router>
  )
}

export default App

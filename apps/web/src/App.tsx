import "./App.css";
import Dashboard from "./components/Dashboard";
import NavSidebar from "./components/NavSidebar";
import { Routes, Route } from "react-router";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Tickets } from "./components/Tickets";
import { Messages } from "./components/Messages";
import { Notifications } from "./components/Notifications";
import { Team } from "./components/Team";
import { Settings } from "./components/Settings";

const App = () => (
  <ErrorBoundary>
    <NavSidebar>
      <Routes>
        <Route path="/" Component={Dashboard} />
        <Route path="/tickets" Component={Tickets} />
        <Route path="/messages" Component={Messages} />
        <Route path="/notifications" Component={Notifications} />
        <Route path="/team" Component={Team} />
        <Route path="/settings" Component={Settings} />
      </Routes>
    </NavSidebar>
  </ErrorBoundary>
);

export default App;

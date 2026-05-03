import "./App.css";
import Dashboard from "./components/Dashboard";
import NavSidebar from "./components/NavSidebar";
import { Routes, Route, Link } from "react-router";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Tickets } from "./components/Tickets";
import { Messages } from "./components/Messages";
import { Notifications } from "./components/Notifications";
import { Teams } from "./components/Team";

const NotFound = () => (
  <>
    <h1>404: Page Not Found</h1>
    <Link to="/">
      <h2>Return to Home.</h2>
    </Link>
  </>
);

const App = () => (
  <ErrorBoundary>
    <NavSidebar>
      <Routes>
        <Route path="/" Component={Dashboard} />
        <Route path="/tickets" Component={Tickets}>
          <Route path=":ticketId" Component={Tickets} />
        </Route>
        <Route path="/messages" Component={Messages} />
        <Route path="/notifications" Component={Notifications} />
        <Route path="/teams" Component={Teams} />
        <Route path="*" Component={NotFound} />
      </Routes>
    </NavSidebar>
  </ErrorBoundary>
);

export default App;

import "./App.css";
import Dashboard from "./components/Dashboard";
import NavSidebar from "./components/NavSidebar";
import { Routes, Route, Link } from "react-router";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Tickets } from "./components/Tickets";
import { Messages } from "./components/Messages";
import { Notifications } from "./components/Notifications";
import { Teams } from "./components/Team";
import { InvitationAccept } from "./components/InvitationAccept";
import { SignUpPage } from "./components/SignUpPage";

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
    <Routes>
      {/* Public routes — no sidebar */}
      <Route path="/invitations/:token" Component={InvitationAccept} />
      <Route path="/sign-up" Component={SignUpPage} />

      {/* Authenticated app routes — inside sidebar */}
      <Route
        path="/*"
        element={
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
        }
      />
    </Routes>
  </ErrorBoundary>
);

export default App;

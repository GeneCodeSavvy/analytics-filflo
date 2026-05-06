import "./App.css";
import NavSidebar from "./components/NavSidebar";
import { Routes, Route, Link } from "react-router";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import Dashboard from "./components/dashboard/index";
import { Tickets } from "./components/tickets/index";
import { Messages } from "./components/messages/index";
import { Notifications } from "./components/notifications/index";
import { Teams } from "./components/teams";
import { InvitationAccept } from "./components/InvitationAccept";
import { SignUpPage } from "./components/SignUpPage";
import { SignInPage } from "./components/SignInPage";
import { AuthRequired } from "./components/AuthRequired";
import { AuthStoreBridge } from "./components/AuthStoreBridge";
import { ApiAuthTokenBridge } from "./components/ApiAuthTokenBridge";
import { NotificationQueryPoller } from "./components/NotificationQueryPoller";

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
    <ApiAuthTokenBridge />
    <AuthStoreBridge />
    <Routes>
      {/* Public routes — no sidebar */}
      <Route path="/invitations/:token" Component={InvitationAccept} />
      <Route path="/sign-in" Component={SignInPage} />
      <Route path="/sign-up" Component={SignUpPage} />

      {/* Authenticated app routes — inside sidebar */}
      <Route
        path="/*"
        element={
          <AuthRequired>
            <NotificationQueryPoller />
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
          </AuthRequired>
        }
      />
    </Routes>
  </ErrorBoundary>
);

export default App;

import { createBrowserRouter } from "react-router";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { ForgotPassword } from "./components/ForgotPassword";
import { ConfirmEmail } from "./components/ConfirmEmail";
import { VerifyNewEmail } from "./components/VerifyNewEmail";
import { Dashboard } from "./components/Dashboard";
import { AccountDetails } from "./components/AccountDetails";
import { PaymentStatus } from "./components/PaymentStatus";
import { CreateLink } from "./components/CreateLink";
import { Links } from "./components/Links";
import { Transactions } from "./components/Transactions";
import { AuthLayout } from "./components/AuthLayout";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { PayLink } from "./components/PayLink";
import { PaymentCancel } from "./components/PaymentCancel";
import { PaymentSuccess } from "./components/PaymentSuccess";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: Login },
      { path: "signup", Component: Signup },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "confirm-email", Component: ConfirmEmail },
    ],
  },
  {
    path: "/verify-new-email",
    Component: VerifyNewEmail,
  },
  {
    path: "/pay/:code",
    Component: PayLink,
  },
  {
    path: "/payment/cancel",
    Component: PaymentCancel,
  },
  {
    path: "/payment/success",
    Component: PaymentSuccess,
  },
  {
    path: "/app",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "account", Component: AccountDetails },
      { path: "payment-status", Component: PaymentStatus },
      { path: "create-link", Component: CreateLink },
      { path: "links", Component: Links },
      { path: "transactions", Component: Transactions },
    ],
  },
]);



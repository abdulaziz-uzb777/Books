import { createBrowserRouter } from "react-router";
import HomePage from "./pages/HomePage";
import BookDetailPage from "./pages/BookDetailPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPanel from "./pages/AdminPanel";
import NotFoundPage from "./pages/NotFoundPage";

// Generate a hashed route for admin panel
const ADMIN_ROUTE = 'admin_abdulaziz787';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/book/:id",
    element: <BookDetailPage />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
  },
  {
    path: `/${ADMIN_ROUTE}`,
    element: <AdminPanel />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export { ADMIN_ROUTE };
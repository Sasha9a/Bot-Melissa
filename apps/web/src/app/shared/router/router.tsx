import DashboardComponent from "@bot-melissa/web/modules/dashboard/dashboard.component";
import LoginComponent from "@bot-melissa/web/modules/user/login/login.component";
import SignInComponent from "@bot-melissa/web/modules/user/login/sign-in.component";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<DashboardComponent />} />
        <Route path='/login' element={<LoginComponent />} />
        <Route path="/signIn" element={<SignInComponent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;

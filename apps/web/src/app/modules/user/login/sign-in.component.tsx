import { loginAxios } from "@bot-melissa/web/core/services/user/user.service";
import React from "react";
import { useLocation } from "react-router-dom";

const SignInComponent: React.FC = () => {

  const queryParams = new URLSearchParams(useLocation().search);
  loginAxios(queryParams.get('code')).subscribe((res) => {
    console.log(res);
  });

  return (
    <p>
      Идет перенаправление...
    </p>
  );
}

export default SignInComponent;

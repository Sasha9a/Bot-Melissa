import React from "react";
import { useLocation } from "react-router-dom";
import locationHashParser from 'parse-location-hash';

const SignInComponent = () => {
  const hash = locationHashParser(useLocation().hash);


  return (
    <p>
      Идет перенаправление...
    </p>
  );
}

export default SignInComponent;

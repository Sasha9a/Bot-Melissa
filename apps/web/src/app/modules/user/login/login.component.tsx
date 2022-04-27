import { Button } from "primereact/button";
import React from "react";

class LoginComponent extends React.Component {
  public query = `https://oauth.vk.com/authorize?client_id=8150888&display=page&redirect_uri=http://localhost:4200/signIn&response_type=token&v=5.131`;

  public override render() {
    return (
      <>
        <a href={this.query} style={{ textDecoration: 'none' }}>
          <Button label="Вход в ВК" className="p-button-primary" />
        </a>
      </>
    );
  }
}

export default LoginComponent;

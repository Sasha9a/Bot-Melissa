import { Button } from "primereact/button";

const App = () => {
  const query = `https://oauth.vk.com/authorize?client_id=${8150888}&display=page&redirect_uri=http://localhost:4200&response_type=token&v=5.131`;
  return (
    <>
      <a href={query} style={{ textDecoration: 'none' }}>
        <Button label="Вход в ВК" className="p-button-primary" />
      </a>
    </>
  );
}

export default App;

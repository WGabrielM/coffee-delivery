import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`

* {
  margin: 0;
  padding: 0;
  box-sizing: 0;
}

:focus {
  outline: 0;
  box-shadow: 0 0 0 2px ${props => props.theme["green-500"]};
}

body {
  -webkit-font-smoothing: antialiased;
  background: ${props => props.theme["gray-900"]};
  color: ${props => props.theme["gray-300"]};
}

body,input, textarea, button {
font-family: 'Roboto', sans-serif;
font-weight: 400;
font-size: 1rem;

}

/* baloo-2-<uniquifier> {
  font-family: "Baloo 2", sans-serif;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
} */

`

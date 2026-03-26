import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import Employee from "modules/employee";

const Main = ({ routes, hasLocalisation, defaultUrl }) => {
  return (
    <main>
      <Switch>
        <Route
          path={`/`}
          render={(props) => {
            return <Employee match={props.match} routes={routes.employee} />;
          }}
        />
        {window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? (
          <Redirect from="/" to={hasLocalisation ? "/language-selection" : defaultUrl.employee} />
        ) : (
          <Redirect from="/" to="/digit-ui/" />
        )}
      </Switch>
    </main>
  );
};

export default Main;


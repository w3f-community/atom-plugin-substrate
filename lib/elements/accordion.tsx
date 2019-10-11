import * as React from "react";
import { CompositeDisposable } from "atom";

import { AccountsBodyPanel } from "./body/accounts";
import { ExtrinsicsBodyPanel } from "./body/extrinsics";
import { NodesBodyPanel } from "./body/nodes";

export type Props = {
  changePanel: (newPanel: string) => void,
};

type Panel = {
  title: string,
  closed: boolean,
};

type State = {
  panels: Panel[],
};

export class AccordionPanel extends React.Component<Props, State> {
  public state: State = {
    panels: [{
      title: "nodes",
      closed: false,
    }, {
      title: "accounts",
      closed: false,
    }, {
      title: "extrinsics",
      closed: false,
    }],
  };
  private subscriptions = new CompositeDisposable();

  public render(): JSX.Element {
    const buttons = this.state.panels.map(
      (val, index) => this.getTab(index, val),
    );
    return (
      <div className="accordion">
        {buttons}
      </div>
    );
  }

  private getTab(index: number, val: Panel) {
    const onButtonClick = (_event: React.MouseEvent) => {
      this.props.changePanel(val.title);
      const panels = this.state.panels;
      panels[index].closed = !panels[index].closed;
      this.setState({ panels });
    };
    const isClosed = val.closed ? "closed" : "";
    const className = `tab ${isClosed}`;
    const panelName = this.getBodyPanelName(val.title);
    const panel = this.getBodyPanel(val.title);
    return (
      <div key={index} className={className}>
        <div className="tab-label" onClick={onButtonClick}>
          <span>{panelName}</span>
        </div>
        <div className="tab-content">{panel}</div>
      </div>
    );
  }

  private getBodyPanelName(value: string): string {
    switch (value) {
      case "nodes":
        return "My node connections";
      case "accounts":
        return "My accounts";
      case "extrinsics":
        return "Available extrinsics";
    }
    return "Invalid panel name";
  }

  private getBodyPanel(value: string) {
    switch (value) {
      case "nodes":
        return <NodesBodyPanel />;
      case "accounts":
        return <AccountsBodyPanel />;
      case "extrinsics":
        return <ExtrinsicsBodyPanel />;
    }
    return <span>Invalid panel!</span>;
  }
}

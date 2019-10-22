import * as React from "react";
import * as ReactDOM from "react-dom";
import * as fs from "fs";
import { Panel } from "atom";
import { Menu as MenuType, MenuItemConstructorOptions, remote } from "electron";
import { connect } from "react-redux";
import { Keyring } from "@polkadot/keyring";
import { KeyringPair$Json } from "@polkadot/keyring/types";
import { KeypairType } from "@polkadot/util-crypto/types";
import * as clipboard from 'clipboardy';

import { AccountComponent, ContextItem } from "../../components/accounts";
import { AddAccount } from "../modals/addAccount";
import { ImportAccount } from "../modals/importAccount";
import { RenameAccount } from "../modals/RenameAccount";
import { TabComponent } from "../../components/tab";
import { AppState } from "../../store";
import { TabsState } from "../../store/modules/tabs/types";
import { addAccount, removeAccount, renameAccount } from "../../store/modules/substrate/actions";
import { togglePanel } from "../../store/modules/tabs/actions";

const { Menu, MenuItem, dialog } = remote;

interface MenuItem {
  item: MenuItemConstructorOptions,
  modal?: Panel;
};

export type Props = {
  id: number,
  tabs: TabsState,
  accounts: KeyringPair$Json[],
  togglePanel: typeof togglePanel,
  addAccount: typeof addAccount,
  removeAccount: typeof removeAccount,
  renameAccount: typeof renameAccount,
};

type State = {
  tabMenu: {
    menu: MenuType,
    menuItems: MenuItem[],
  },

  accountContextItems: ContextItem[],
  accountInput: {
    name: string;
    key: string;
  },
};

class AccountsBodyPanel extends React.Component<Props, State> {
  public state: State = {
    tabMenu: {
      menu: new Menu(),
      menuItems: [],
    },

    accountContextItems: [{
      label: "Copy address",
      click: this.copyAddress.bind(this),
    }, {
      label: "Remove account",
      click: this.removeAccount.bind(this),
    }, {
      label: "Export account",
      click: this.exportAccount.bind(this),
    }, {
      label: "Rename account",
      click: this.renameAccount.bind(this),
    }],
    accountInput: { name: "", key: "" },
  };

  componentDidMount() {
    const { tabMenu } = this.state;
    tabMenu.menuItems = this.initMenuItems();
    tabMenu.menuItems.forEach((val) => {
      tabMenu.menu.append(new MenuItem(val.item));
    });
    this.setState({ tabMenu });
  }

  public render(): JSX.Element {
    const val = this.props.tabs.panels.find(
      (value) => value.id === this.props.id,
    );
    if (!val) {
      return <span>Invalid tabs</span>;
    }
    const accounts = this.props.accounts.map((pair: KeyringPair$Json, index: number) => {
      return (
        <AccountComponent
          key={index}
          pair={pair}
          accountContextItems={this.state.accountContextItems}
          onClick={this.handleAccountMenuClick.bind(this)}
        />
      );
    });
    return (
      <TabComponent
        className="accounts"
        panel={val}
        onTabClick={() => this.props.togglePanel(val.id)}
        onActionsClick={() => this.state.tabMenu.menu.popup({})}
      >
        {accounts}
      </TabComponent>
    );
  }

  private initMenuItems(): MenuItem[] {
    const menuItems = [];
    menuItems.push(this.initModal('Add account', true, AddAccount, (
      name: string,
      keypairType: KeypairType,
      seed: string,
      pass: string,
    ) => {
      const keyring = new Keyring({ type: keypairType });
      const pair = keyring.addFromUri(seed, { name }, keypairType);
      const json = pair.toJson(pass);
      this.props.addAccount(json);
    }));
    menuItems.push(this.initModal('Import acccount', true, ImportAccount, (path: string) => {
      const rawdata = fs.readFileSync(path);
      const pair: KeyringPair$Json = JSON.parse(rawdata.toString());
      const exKey = this.props.accounts.find((val) => val.meta.name === name);
      if (exKey) {
        atom.notifications.addError("Account with same name already exists");
        return;
      }
      this.props.addAccount(pair);
    }));
    return menuItems;
  }

  // Todo: Move to helper folder
  private initModal(label: string, enabled: boolean, component: any, confirmClick: any): MenuItem {
    const click = () => {
      const menuItems = this.state.tabMenu.menuItems;
      const item = menuItems.find(val => val.item.label === label);
      if (!item) {
        return console.error("Invalid item");
      }
      const modal = item.modal;
      if (!modal) {
        return;
      }
      modal.visible ? modal.hide() : modal.show();
    };
    const modal = document.createElement("div");
    ReactDOM.render(React.createElement(component, {
      closeModal: click,
      confirmClick,
    }), modal);
    return {
      item: { label, click, enabled },
      modal: atom.workspace.addModalPanel({
        item: modal,
        visible: false,
      }),
    };
  }

  private initAccountContextItemModal(component: any, props: any, confirmClick: any, click: () => void): Panel {
    const modal = document.createElement("div");
    ReactDOM.render(React.createElement(component, {
      closeModal: click,
      confirmClick,
      ...props,
    }), modal);
    return atom.workspace.addModalPanel({
      item: modal,
      visible: false,
    });
  }

  private handleAccountMenuClick(label: string, pair: KeyringPair$Json) {
    this.state.accountContextItems.forEach(val => {
      if (val.label === label) {
        val.click(pair);
        return;
      }
    })
  }

  private copyAddress(pair: KeyringPair$Json) {
    clipboard.writeSync(pair.address);
  }

  private removeAccount(pair: KeyringPair$Json) {
    this.props.removeAccount(pair.meta.name);
    this.forceUpdate();
  }

  private async exportAccount(pair: KeyringPair$Json) {
    const savePath: any = await dialog.showSaveDialog({});
    if (!savePath) {
      return;
    }
    fs.writeFileSync(savePath, JSON.stringify(pair), "utf8");
  }

  private async renameAccount(pair: KeyringPair$Json) {
    const mod = this.initAccountContextItemModal(RenameAccount, { pair }, (name: string) => {
      this.props.renameAccount(pair.meta.name, name);
    }, () => mod.hide());
    mod.show();
  }
}

const mapStateToProps = (state: AppState) => ({
  tabs: state.tabs,
  accounts: state.substrate.accounts,
});

export default connect(
  mapStateToProps,
  { togglePanel, addAccount, removeAccount, renameAccount }
)(AccountsBodyPanel);

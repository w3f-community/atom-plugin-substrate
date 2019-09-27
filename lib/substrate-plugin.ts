import SubstratePluginView from './substrate-plugin-view';
import { CompositeDisposable, Panel } from 'atom';

export default {
  substratePluginView: null as SubstratePluginView | null,
  modalPanel: null as Panel<HTMLElement> | null,
  subscriptions: null as CompositeDisposable | null,
  statusBarTile: null as any | null,

  activate(state: any) {
    console.log('Activating substrate plugin...');

    this.substratePluginView = new SubstratePluginView(state.substratePluginViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.substratePluginView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'substrate-plugin:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel!.destroy();
    this.subscriptions!.dispose();
    this.substratePluginView!.destroy();
  },

  serialize() {
    return {
      substratePluginViewState: this.substratePluginView!.serialize()
    };
  },

  consumeStatusBar(statusBar: any) {
    const div = document.createElement("div");
    div.classList.add("inline-block");
    const icon = document.createElement("span");
    icon.textContent = "Substrate";
    const link = document.createElement("a");
    link.appendChild(icon);
    link.onclick = (_e) => {
      this.toggle();
    };
    atom.tooltips.add(div, { title: "Toggle Substrate plugin sidebar" });
    div.appendChild(link);
    this.statusBarTile = statusBar.addRightTile({ item: div, priority: 0 });
  },

  toggle() {
    console.log('SubstratePlugin was toggled!');
    return (
      this.modalPanel!.isVisible() ?
      this.modalPanel!.hide() :
      this.modalPanel!.show()
    );
  }
};

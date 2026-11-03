import * as React from "react";

type MountProps = {
  children?: React.ReactNode;
  onReady: () => void;
  onError: (error: Error) => void;
};

const Ready: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  React.useEffect(() => {
    // Run after the plugin's synchronous mount effects and error boundaries.
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) onReady();
    });
    return () => {
      mounted = false;
    };
  }, [onReady]);
  return null;
};

export default class PluginMount extends React.Component<MountProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.failed) return null;
    return (
      <>
        {this.props.children}
        <Ready onReady={this.props.onReady} />
      </>
    );
  }
}

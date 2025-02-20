/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  FlexColumn,
  Button,
  styled,
  Text,
  FlexRow,
  Spacer,
  Input,
  Label,
} from 'flipper';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {State as Store} from '../reducers';
import {launchJsEmulator} from '../utils/js-client/serverUtils';

const Container = styled(FlexColumn)({
  padding: 20,
  width: 800,
});

const Title = styled(Text)({
  marginBottom: 18,
  marginRight: 10,
  fontWeight: 100,
  fontSize: '40px',
});

const textareaStyle = {
  margin: 0,
  marginBottom: 10,
};

const TitleInput = styled(Input)({
  ...textareaStyle,
  height: 30,
});

type OwnProps = {
  onHide: () => void;
};

type StateFromProps = {};

type DispatchFromProps = {};

type State = {
  url: string;
  width: number;
  height: number;
};

type Props = OwnProps & StateFromProps & DispatchFromProps;
class JSEmulatorLauncherSheet extends Component<Props, State> {
  state: State = {
    url: 'http://localhost:8888',
    width: 800,
    height: 600,
  };

  onUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({url: e.target.value});
  };

  onHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({height: Number(e.target.value)});
  };

  onWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({width: Number(e.target.value)});
  };

  render() {
    const {url, height, width} = this.state;
    return (
      <Container>
        <Title>Launch Web App</Title>
        <Label>Url</Label>
        <TitleInput value={url} onChange={this.onUrlChange} />
        <Label>Height</Label>
        <TitleInput value={height} onChange={this.onHeightChange} />
        <Label>Width</Label>
        <TitleInput value={width} onChange={this.onWidthChange} />

        <br />
        <FlexRow>
          <Spacer />
          <Button compact padded onClick={this.props.onHide}>
            Cancel
          </Button>
          <Button
            type="primary"
            compact
            padded
            onClick={() => {
              launchJsEmulator(
                this.state.url,
                this.state.height,
                this.state.width,
              );
              this.props.onHide();
            }}>
            Launch
          </Button>
        </FlexRow>
      </Container>
    );
  }
}

export default connect<StateFromProps, DispatchFromProps, OwnProps, Store>(
  () => ({}),
  {},
)(JSEmulatorLauncherSheet);

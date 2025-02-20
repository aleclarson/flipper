/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import styled from 'react-emotion';
import {colors} from './colors';

export const inputStyle = (compact: boolean, readOnly: boolean) => ({
  border: `1px solid ${colors.light15}`,
  borderRadius: 4,
  font: 'inherit',
  fontSize: '1em',
  height: compact ? '17px' : '28px',
  lineHeight: compact ? '17px' : '28px',
  backgroundColor: readOnly ? colors.light02 : undefined,
  '&:disabled': {
    backgroundColor: '#ddd',
    borderColor: '#ccc',
    cursor: 'not-allowed',
  },
});

const Input = styled('input')(
  ({compact, readOnly}: {compact?: boolean; readOnly?: boolean}) => ({
    ...inputStyle(compact || false, readOnly || false),
    padding: compact ? '0 5px' : '0 10px',
  }),
);

Input.displayName = 'Input';

Input.defaultProps = {
  type: 'text',
};

export default Input;

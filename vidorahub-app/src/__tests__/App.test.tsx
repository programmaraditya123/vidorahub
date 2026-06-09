import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('VidoraHub App', () => {
  it('renders text', () => {
    const { getByText } = render(<Text>VidoraHub</Text>);
    expect(getByText('VidoraHub')).toBeTruthy();
  });
});

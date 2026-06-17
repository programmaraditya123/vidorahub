declare module 'react-native-vector-icons/Ionicons' {
  import type { Icon } from 'react-native-vector-icons/Icon';

  const Ionicons: Icon & {
    glyphMap: Record<string, number>;
  };

  export default Ionicons;
}

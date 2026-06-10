import { Image, StyleSheet, View } from "react-native";

interface Props {
  compact?: boolean;
}

export function BrandHeader({ compact = false }: Props) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Image
        source={require("../../assets/images/NewCareLogoHorizontal.png")}
        style={[styles.logo, compact && styles.logoCompact]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    alignSelf: "stretch",
    justifyContent: "center",
    marginBottom: 18,
    minHeight: 44,
  },
  compact: {
    minHeight: 36,
    marginBottom: 14,
  },
  logo: {
    height: 43,
    width: 220,
  },
  logoCompact: {
    height: 34,
    width: 175,
  },
});

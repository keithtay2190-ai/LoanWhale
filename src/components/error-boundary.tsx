import { Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { colors, fontFamily, fontSize, spacing } from '@/lib/theme';

type Props = { children: ReactNode };
type State = { hasError: boolean };

// Catches unexpected render-time crashes anywhere in the tree (a genuinely
// different failure mode from network/data errors, which are already handled
// per-screen) so the app shows a recoverable screen instead of going blank
// or crashing outright.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unexpected error caught by ErrorBoundary:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            Sorry about that — please try again. If it keeps happening, restart the app.
          </Text>
          <View style={styles.buttonWrap}>
            <PrimaryButton label="Try Again" onPress={this.handleReset} />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  buttonWrap: {
    marginTop: spacing.xl,
  },
});

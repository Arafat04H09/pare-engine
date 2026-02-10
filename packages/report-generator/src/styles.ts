import { StyleSheet, Font } from '@react-pdf/renderer';

// Font registration would go here in production
// Font.register({ family: 'Inter', src: '...' });

export const colors = {
  primary: '#1B2A4A', // Deep Navy
  accent: '#00D4AA',  // Electric Teal
  warning: '#FFB020',
  success: '#22C55E',
  text: '#334155',
  lightGray: '#F8FAFC',
  white: '#FFFFFF'
};

export const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    fontFamily: 'Helvetica', // Fallback
    padding: 30,
    color: colors.text
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    color: colors.primary
  },
  section: {
    margin: 10,
    padding: 10,
  },
  scoreBig: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center'
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 1.5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10
  }
});

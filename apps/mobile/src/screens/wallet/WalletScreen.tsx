import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Chip,
  Divider,
  Modal,
  Portal,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackHeader } from '../../components/ui/Header';
import { useAppAuth } from '../../context/AuthProvider';
import { useWallet } from '../../hooks/useWallet';
import {
  formatWalletAmount,
  getTransactionColor,
  getTransactionIcon,
  getTransactionSourceLabel,
  MobileMoneyProvider
} from '../../services/wallet';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Wallet'>;

export default function WalletScreen({ navigation }: Props) {
  const theme = useTheme();
  const { user } = useAppAuth();
  const {
    balance,
    activity,
    transactions,
    isLoading,
    error,
    refreshBalance,
    refreshActivity,
    refreshTransactions,
    withdrawToMobileMoney,
    withdrawToBank,
    topUp,
    ensureWallet,
    clearError,
  } = useWallet();

  const [refreshing, setRefreshing] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'mobile_money' | 'bank'>('mobile_money');
  const [topUpMethod, setTopUpMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<MobileMoneyProvider>('mtn');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Ensure wallet exists when screen loads
    ensureWallet();
  }, [ensureWallet]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshBalance(), refreshActivity(), refreshTransactions()]);
    setRefreshing(false);
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (balance && withdrawAmount > balance.balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setProcessing(true);
    try {
      if (withdrawMethod === 'mobile_money') {
        if (!phone) {
          Alert.alert('Error', 'Please enter a phone number');
          return;
        }
        await withdrawToMobileMoney(withdrawAmount, phone, provider);
        Alert.alert('Success', 'Withdrawal initiated. You will receive your funds shortly.');
      } else {
        if (!bankCode || !accountNumber || !accountName) {
          Alert.alert('Error', 'Please fill in all bank details');
          return;
        }
        await withdrawToBank(withdrawAmount, bankCode, accountNumber, accountName);
        Alert.alert('Success', 'Bank withdrawal initiated. Funds will arrive within 1-3 business days.');
      }
      setWithdrawModalVisible(false);
      resetForm();
    } catch {
      // Error is handled by the hook
    } finally {
      setProcessing(false);
    }
  };

  const handleTopUp = async () => {
    const topUpAmount = parseFloat(amount);
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const result = await topUp(
        topUpAmount,
        topUpMethod,
        topUpMethod === 'mobile_money' ? phone : undefined,
        topUpMethod === 'mobile_money' ? provider : undefined,
        topUpMethod === 'card' ? user?.email : undefined, // Pass email for card payments
      );

      if (result.checkoutUrl) {
        // Open checkout URL for card payments
        Alert.alert('Redirect', 'You will be redirected to complete the payment.');
        // Could use Linking.openURL here
      } else {
        Alert.alert('Success', result.message);
      }

      setTopUpModalVisible(false);
      resetForm();
    } catch {
      // Error is handled by the hook
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPhone('');
    setProvider('mtn');
    setBankCode('');
    setAccountNumber('');
    setAccountName('');
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-ZM', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StackHeader
        title="Wallet"
        onBackPress={() => navigation.goBack()}
        variant="gradient"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.tertiary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <Text variant="titleMedium" style={styles.balanceLabel}>
                Available Balance
              </Text>
              {balance?.isFrozen && (
                <Chip
                  compact
                  icon="lock"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  textStyle={{ color: '#fff' }}
                >
                  Frozen
                </Chip>
              )}
            </View>

            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                scale: { type: 'spring', damping: 15 },
                opacity: { type: 'timing', duration: 300 },
              }}
            >
              <Text variant="displayLarge" style={styles.balanceAmount}>
                {balance ? formatWalletAmount(balance.balance) : 'K0.00'}
              </Text>
            </MotiView>

            {balance && balance.pendingBalance > 0 && (
              <Text variant="bodySmall" style={styles.pendingBalance}>
                + {formatWalletAmount(balance.pendingBalance)} pending
              </Text>
            )}

            {/* Action Buttons */}
            <View style={styles.balanceActions}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => setTopUpModalVisible(true)}
              >
                <Icon name="plus" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Top Up</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => setWithdrawModalVisible(true)}
                disabled={!balance || balance.balance <= 0 || balance.isFrozen}
              >
                <Icon name="bank-transfer-out" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Withdraw</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats Cards */}
        {activity && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.statsRow}>
              <Surface style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
                <Icon name="trending-up" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
                  {formatWalletAmount(activity.thisMonthEarnings)}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  This Month
                </Text>
              </Surface>

              <Surface style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
                <Icon name="clock-outline" size={24} color={theme.colors.secondary} />
                <Text variant="titleMedium" style={{ color: theme.colors.onSecondaryContainer, fontWeight: '700' }}>
                  {formatWalletAmount(activity.pendingWithdrawals)}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
                  Pending
                </Text>
              </Surface>

              <Surface style={[styles.statCard, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={0}>
                <Icon name="cash-check" size={24} color={theme.colors.tertiary} />
                <Text variant="titleMedium" style={{ color: theme.colors.onTertiaryContainer, fontWeight: '700' }}>
                  {balance ? formatWalletAmount(balance.totalEarned) : 'K0'}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer }}>
                  Total Earned
                </Text>
              </Surface>
            </View>
          </Animated.View>
        )}

        {/* Transactions */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              Recent Transactions
            </Text>
            <Pressable onPress={() => navigation.navigate('WalletTransactions' as never)}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                See All
              </Text>
            </Pressable>
          </View>

          {isLoading && transactions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : transactions.length === 0 ? (
            <Surface style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
              <Icon name="wallet-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                No transactions yet
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Your wallet transactions will appear here
              </Text>
            </Surface>
          ) : (
            <Surface style={[styles.transactionsCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              {transactions.slice(0, 10).map((tx, index) => (
                <React.Fragment key={tx._id}>
                  <Pressable style={styles.transactionItem}>
                    <View
                      style={[
                        styles.transactionIcon,
                        { backgroundColor: getTransactionColor(tx.type, tx.status) + '20' },
                      ]}
                    >
                      <Icon
                        name={getTransactionIcon(tx.type, tx.source)}
                        size={20}
                        color={getTransactionColor(tx.type, tx.status)}
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                        {getTransactionSourceLabel(tx.source)}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatDate(tx.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text
                        variant="titleSmall"
                        style={{
                          color: getTransactionColor(tx.type, tx.status),
                          fontWeight: '700',
                        }}
                      >
                        {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'}
                        {formatWalletAmount(tx.amount)}
                      </Text>
                      {tx.status === 'pending' && (
                        <Chip compact style={{ marginTop: 4 }}>
                          Pending
                        </Chip>
                      )}
                    </View>
                  </Pressable>
                  {index < Math.min(transactions.length, 10) - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Surface>
          )}
        </Animated.View>
      </ScrollView>

      {/* Withdraw Modal */}
      <Portal>
        <Modal
          visible={withdrawModalVisible}
          onDismiss={() => setWithdrawModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
              Withdraw Funds
            </Text>

            <SegmentedButtons
              value={withdrawMethod}
              onValueChange={(value) => setWithdrawMethod(value as 'mobile_money' | 'bank')}
              buttons={[
                { value: 'mobile_money', label: 'Mobile Money', icon: 'cellphone' },
                { value: 'bank', label: 'Bank Account', icon: 'bank' },
              ]}
              style={{ marginBottom: 12 }}
            />

            <TextInput
              mode="outlined"
              label="Amount (ZMW)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="K" />}
              style={{ marginBottom: 12 }}
            />

            {withdrawMethod === 'mobile_money' ? (
              <>
                <TextInput
                  mode="outlined"
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="260XXXXXXXXX"
                  style={{ marginBottom: 12 }}
                />

                <Text variant="labelMedium" style={{ marginBottom: 6, color: theme.colors.onSurface }}>
                  Select Provider
                </Text>
                <View style={[styles.providerRow, { marginBottom: 0 }]}>
                  {(['mtn', 'airtel', 'zamtel'] as const).map((p) => (
                    <Pressable
                      key={p}
                      style={[
                        styles.providerButton,
                        {
                          backgroundColor:
                            provider === p ? theme.colors.primary : theme.colors.surfaceVariant,
                        },
                      ]}
                      onPress={() => setProvider(p)}
                    >
                      <Text
                        style={{
                          color: provider === p ? '#fff' : theme.colors.onSurfaceVariant,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <>
                <TextInput
                  mode="outlined"
                  label="Bank Code"
                  value={bankCode}
                  onChangeText={setBankCode}
                  style={{ marginBottom: 10 }}
                />
                <TextInput
                  mode="outlined"
                  label="Account Number"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="number-pad"
                  style={{ marginBottom: 10 }}
                />
                <TextInput
                  mode="outlined"
                  label="Account Name"
                  value={accountName}
                  onChangeText={setAccountName}
                  style={{ marginBottom: 0 }}
                />
              </>
            )}

            <Button
              mode="contained"
              onPress={handleWithdraw}
              loading={processing}
              disabled={processing}
              style={{ marginTop: withdrawMethod === 'mobile_money' ? 8 : 12 }}
            >
              Withdraw
            </Button>
        </Modal>
      </Portal>

      {/* Top Up Modal */}
      <Portal>
        <Modal
          visible={topUpModalVisible}
          onDismiss={() => setTopUpModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
              Top Up Wallet
            </Text>

            <SegmentedButtons
              value={topUpMethod}
              onValueChange={(value) => setTopUpMethod(value as 'mobile_money' | 'card')}
              buttons={[
                { value: 'mobile_money', label: 'Mobile Money', icon: 'cellphone' },
                { value: 'card', label: 'Card', icon: 'credit-card' },
              ]}
              style={{ marginBottom: 12 }}
            />

            <TextInput
              mode="outlined"
              label="Amount (ZMW)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="K" />}
              style={{ marginBottom: 12 }}
            />

            {topUpMethod === 'mobile_money' && (
              <>
                <TextInput
                  mode="outlined"
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="260XXXXXXXXX"
                  style={{ marginBottom: 12 }}
                />

                <Text variant="labelMedium" style={{ marginBottom: 6, color: theme.colors.onSurface }}>
                  Select Provider
                </Text>
                <View style={[styles.providerRow, { marginBottom: 0 }]}>
                  {(['mtn', 'airtel', 'zamtel'] as const).map((p) => (
                    <Pressable
                      key={p}
                      style={[
                        styles.providerButton,
                        {
                          backgroundColor:
                            provider === p ? theme.colors.primary : theme.colors.surfaceVariant,
                        },
                      ]}
                      onPress={() => setProvider(p)}
                    >
                      <Text
                        style={{
                          color: provider === p ? '#fff' : theme.colors.onSurfaceVariant,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {topUpMethod === 'card' && (
              <Surface style={[styles.infoBox, { backgroundColor: theme.colors.primaryContainer, marginTop: 8, marginBottom: 12 }]} elevation={0}>
                <Icon name="information" size={20} color={theme.colors.primary} />
                <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, marginLeft: 8, flex: 1 }}>
                  You will be redirected to a secure payment page to complete your card payment.
                </Text>
              </Surface>
            )}

            <Button
              mode="contained"
              onPress={handleTopUp}
              loading={processing}
              disabled={processing}
              style={{ marginTop: topUpMethod === 'mobile_money' ? 8 : 0 }}
            >
              Top Up
            </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 40,
  },
  pendingBalance: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalContent: {
    paddingBottom: 20,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  providerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
});

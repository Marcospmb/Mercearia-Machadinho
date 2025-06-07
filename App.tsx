import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  Button,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

import { db } from './src/firebaseConfig';

const Tab = createBottomTabNavigator();

type Produto = {
  id: string;
  nome: string;
  quantidade: number;
  quantidadeMinima: number;
  categoria: string;
  valorCompra: number;
  valorVenda: number;
};

type ItemVenda = {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorVenda: number;
};



function ProdutoForm({
  onSubmit,
  produtoEditar,
  cancelarEdicao,
}: {
  onSubmit: (produto: Omit<Produto, 'id'>) => void;
  produtoEditar: Produto | null;
  cancelarEdicao: () => void;
}) {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [quantidadeMinima, setQuantidadeMinima] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valorCompra, setValorCompra] = useState('');
  const [valorVenda, setValorVenda] = useState('');

  useEffect(() => {
    if (produtoEditar) {
      setNome(produtoEditar.nome);
      setQuantidade(produtoEditar.quantidade.toString());
      setQuantidadeMinima(produtoEditar.quantidadeMinima.toString());
      setCategoria(produtoEditar.categoria);
      setValorCompra(produtoEditar.valorCompra.toString());
      setValorVenda(produtoEditar.valorVenda.toString());
    } else {
      limparFormulario();
    }
  }, [produtoEditar]);

  const limparFormulario = () => {
    setNome('');
    setQuantidade('');
    setQuantidadeMinima('');
    setCategoria('');
    setValorCompra('');
    setValorVenda('');
  };

  const validarEEnviar = () => {
    if (
      !nome.trim() ||
      !quantidade ||
      !quantidadeMinima ||
      !categoria ||
      !valorCompra ||
      !valorVenda
    ) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    const qtdNum = parseInt(quantidade);
    const qtdMinNum = parseInt(quantidadeMinima);
    const vcNum = parseFloat(valorCompra);
    const vvNum = parseFloat(valorVenda);

    if (isNaN(qtdNum) || isNaN(qtdMinNum) || isNaN(vcNum) || isNaN(vvNum)) {
      Alert.alert('Erro', 'Quantidade, quantidade mínima e valores devem ser números válidos.');
      return;
    }

    onSubmit({
      nome: nome.trim(),
      quantidade: qtdNum,
      quantidadeMinima: qtdMinNum,
      categoria,
      valorCompra: vcNum,
      valorVenda: vvNum,
    });

    if (!produtoEditar) limparFormulario();
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.titulo}>
        {produtoEditar ? 'Editar Produto' : 'Adicionar Produto'}
      </Text>

      <TextInput
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
        autoCapitalize="sentences"
      />

      <TextInput
        placeholder="Quantidade"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Quantidade Mínima"
        value={quantidadeMinima}
        onChangeText={setQuantidadeMinima}
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={categoria}
          onValueChange={(itemValue) => setCategoria(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Selecione uma categoria" value="" />
          <Picker.Item label="Cereais" value="Cereais" />
          <Picker.Item label="Limpeza" value="Limpeza" />
          <Picker.Item label="Frios" value="Frios" />
          <Picker.Item label="Bebidas" value="Bebidas" />
          <Picker.Item label="Animais" value="Animais" />
          <Picker.Item label="Outros" value="Outros" />
        </Picker>
      </View>

      <TextInput
        placeholder="Valor de Compra"
        value={valorCompra}
        onChangeText={setValorCompra}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Valor de Venda"
        value={valorVenda}
        onChangeText={setValorVenda}
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button
          title={produtoEditar ? 'Atualizar' : 'Adicionar'}
          onPress={validarEEnviar}
        />
        {produtoEditar && (
          <Button title="Cancelar" color="#888" onPress={cancelarEdicao} />
        )}
      </View>
    </View>
  );
}

function ProdutoList({
  produtos,
  onEditar,
  onExcluir,
  onRegistrarVenda,
}: {
  produtos: Produto[];
  onEditar: (p: Produto) => void;
  onExcluir: (id: string) => void;
  onRegistrarVenda: (p: Produto) => void;
}) {
  return (
    <FlatList
      data={produtos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 80 }}
      renderItem={({ item }) => {
        const lucro = item.valorVenda - item.valorCompra;
        const margem =
          item.valorCompra > 0
            ? ((lucro / item.valorCompra) * 100).toFixed(1)
            : '0';

        const estaBaixoEstoque = item.quantidade <= item.quantidadeMinima;

        return (
          <View
            style={[
              styles.produtoCard,
              estaBaixoEstoque && styles.produtoCardBaixoEstoque,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.produtoNome,
                  estaBaixoEstoque && styles.textoAlerta,
                ]}
              >
                {item.nome}
              </Text>
              <Text
                style={[styles.produtoInfo, estaBaixoEstoque && styles.textoAlerta]}
              >
                Categoria: {item.categoria}
              </Text>
              <Text
                style={[styles.produtoInfo, estaBaixoEstoque && styles.textoAlerta]}
              >
                Qtd: {item.quantidade} (Min: {item.quantidadeMinima})
              </Text>
              <Text
                style={[styles.produtoInfo, estaBaixoEstoque && styles.textoAlerta]}
              >
                Compra: R${item.valorCompra.toFixed(2)} | Venda: R${item.valorVenda.toFixed(2)}
              </Text>
              <Text
                style={[styles.produtoLucro, estaBaixoEstoque && styles.textoAlerta]}
              >
                Lucro: R${lucro.toFixed(2)} ({margem}%)
              </Text>
              {estaBaixoEstoque && (
                <Text style={styles.alertaEstoque}>⚠ Produto perto do fim do estoque!</Text>
              )}
            </View>

            <View style={styles.iconButtons}>
              <TouchableOpacity
                onPress={() => onRegistrarVenda(item)}
                style={styles.iconButton}
              >
                <Icon name="shopping-cart" size={24} color="#007BFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onEditar(item)} style={styles.iconButton}>
                <Icon name="edit" size={24} color="#FFA500" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onExcluir(item.id)} style={styles.iconButton}>
                <Icon name="delete" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

function EstoqueScreen() {
  const [estoque, setEstoque] = useState<Produto[]>([]);
  const [produtoEditar, setProdutoEditar] = useState<Produto | null>(null);

  const carregarEstoque = async () => {
    const snapshot = await getDocs(collection(db, 'estoque'));
    const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Produto[];
    setEstoque(dados);
  };

  useEffect(() => {
    carregarEstoque();
  }, []);

  const salvarProduto = async (produto: Omit<Produto, 'id'>) => {
    // Validação produto duplicado pelo nome (ignorar case)
    const nomeLower = produto.nome.toLowerCase();
    const duplicado = estoque.find(
      (p) => p.nome.toLowerCase() === nomeLower && p.id !== produtoEditar?.id
    );

    if (duplicado) {
      Alert.alert('Produto duplicado', 'Já existe um produto cadastrado com este nome.');
      return;
    }

    try {
      if (produtoEditar) {
        const ref = doc(db, 'estoque', produtoEditar.id);
        await updateDoc(ref, produto);
        Alert.alert('Sucesso', 'Produto atualizado com sucesso.');
        setProdutoEditar(null);
      } else {
        await addDoc(collection(db, 'estoque'), produto);
        Alert.alert('Sucesso', 'Produto criado com sucesso.');
      }
      carregarEstoque();
    } catch (e: any) {
      Alert.alert('Erro ao salvar produto', e.message);
    }
  };

  const cancelarEdicao = () => setProdutoEditar(null);

  const excluirProduto = (id: string) => {
    Alert.alert('Excluir Produto', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'estoque', id));
          if (produtoEditar?.id === id) setProdutoEditar(null);
          carregarEstoque();
        },
      },
    ]);
  };

  const registrarVenda = async (produto: Produto) => {
    if (produto.quantidade < 1) {
      Alert.alert('Estoque insuficiente');
      return;
    }

    try {
      await addDoc(collection(db, 'vendas'), {
        nome: produto.nome,
        quantidade: 1,
        data: new Date().toISOString(),
      });

      await updateDoc(doc(db, 'estoque', produto.id), {
        quantidade: produto.quantidade - 1,
      });

      carregarEstoque();
    } catch (e: any) {
      Alert.alert('Erro ao registrar venda', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <ProdutoForm
        onSubmit={salvarProduto}
        produtoEditar={produtoEditar}
        cancelarEdicao={cancelarEdicao}
      />

      <Text style={styles.subtitulo}>Estoque Atual</Text>

      <ProdutoList
        produtos={estoque}
        onEditar={setProdutoEditar}
        onExcluir={excluirProduto}
        onRegistrarVenda={registrarVenda}
      />
    </View>
  );
}



function VendaScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);

  const carregarProdutos = async () => {
    const snapshot = await getDocs(collection(db, 'estoque'));
    const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Produto[];
    setProdutos(dados);
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const adicionarAoCarrinho = () => {
    const qtd = parseInt(quantidade);

    if (!produtoSelecionado || isNaN(qtd) || qtd <= 0) {
      Alert.alert('Erro', 'Selecione um produto e informe uma quantidade válida.');
      return;
    }

    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return;

    const existente = carrinho.find((item) => item.produtoId === produto.id);
    if (existente) {
      Alert.alert('Aviso', 'Produto já adicionado. Remova ou edite no carrinho.');
      return;
    }

    setCarrinho((prev) => [
      ...prev,
      {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: qtd,
        valorVenda: produto.valorVenda,
      },
    ]);

    setProdutoSelecionado('');
    setQuantidade('');
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho((prev) => prev.filter((item) => item.produtoId !== produtoId));
  };

  const confirmarVenda = async () => {
    if (carrinho.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione pelo menos um item.');
      return;
    }

    try {
      // Validar estoque antes
      for (const item of carrinho) {
        const produto = produtos.find((p) => p.id === item.produtoId);
        if (!produto || produto.quantidade < item.quantidade) {
          throw new Error(`Estoque insuficiente para: ${item.nome}`);
        }
      }

      // Registrar cada item no Firebase como parte de uma venda
      const vendaRef = collection(db, 'vendas');
      const dataVenda = new Date().toISOString();

      for (const item of carrinho) {
        await addDoc(vendaRef, {
          nome: item.nome,
          quantidade: item.quantidade,
          valorVenda: item.valorVenda,
          data: dataVenda,
        });

        const produto = produtos.find((p) => p.id === item.produtoId);
        if (produto) {
          await updateDoc(doc(db, 'estoque', produto.id), {
            quantidade: produto.quantidade - item.quantidade,
          });
        }
      }

      Alert.alert('Sucesso', 'Venda registrada com sucesso.');
      setCarrinho([]);
      carregarProdutos();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Venda de Múltiplos Produtos</Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={produtoSelecionado}
          onValueChange={setProdutoSelecionado}
          style={styles.picker}
        >
          <Picker.Item label="Selecione um produto" value="" />
          {produtos.map((p) => (
            <Picker.Item
              key={p.id}
              label={`${p.nome} - Estoque: ${p.quantidade}`}
              value={p.id}
            />
          ))}
        </Picker>
      </View>

      <TextInput
        placeholder="Quantidade"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button title="Adicionar ao Carrinho" onPress={adicionarAoCarrinho} />

      {carrinho.length > 0 && (
        <>
          <Text style={styles.subtitulo}>Itens no Carrinho</Text>
          <FlatList
            data={carrinho}
            keyExtractor={(item) => item.produtoId}
            renderItem={({ item }) => (
              <View style={styles.vendaCard}>
                <Text>{item.nome}</Text>
                <Text>Qtd: {item.quantidade}</Text>
                <Text>R$ {item.valorVenda.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removerDoCarrinho(item.produtoId)}>
                  <Text style={{ color: '#b00020' }}>Remover</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <Button title="Confirmar Venda" onPress={confirmarVenda} />
        </>
      )}
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Estoque" component={EstoqueScreen} />
        <Tab.Screen name="Venda Manual" component={VendaScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitulo: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  produtoCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  produtoCardBaixoEstoque: {
    backgroundColor: '#ffcccc',
  },
  produtoNome: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  produtoInfo: {
    fontSize: 14,
  },
  produtoLucro: {
    marginTop: 4,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  textoAlerta: {
    color: '#b00020',
  },
  alertaEstoque: {
    marginTop: 4,
    fontWeight: 'bold',
    color: '#b00020',
  },
  iconButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  iconButton: {
    marginHorizontal: 6,
  },
  vendaCard: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
    vendasPorDiaContainer: {
    marginBottom: 20,
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 6,
  },
  dataTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  vendaItem: {
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },

});

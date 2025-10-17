Text file: README.md
Latest content with line numbers:
1	# Sistema BioBox - Gerenciamento de Produção de Móveis
2	
3	Sistema completo para gerenciamento de pedidos, produção e vendas de móveis estofados.
4	
5	## 🚀 Funcionalidades
6	
7	### Para Vendedores
8	- ✅ Login personalizado por vendedor
9	- ✅ Criação de pedidos completos
10	- ✅ Gestão de clientes
11	- ✅ Rastreamento de vendas pessoais
12	- ✅ Interface intuitiva em 3 etapas
13	
14	### Para Administradores
15	- ✅ Visão completa de todos os pedidos
16	- ✅ Gestão de usuários e permissões
17	- ✅ Relatórios e estatísticas em tempo real
18	- ✅ Controle total do sistema
19	- ✅ Dashboard com métricas importantes
20	
21	### Recursos Técnicos
22	- ✅ Interface responsiva (desktop e mobile)
23	- ✅ Integração com Supabase (banco de dados)
24	- ✅ Sistema de fallback offline
25	- ✅ Geração de códigos de barras
26	- ✅ Impressão térmica em bobinas
27	- ✅ Autenticação e permissões
28	- ✅ Dados em tempo real
29	
30	## 🛠️ Tecnologias Utilizadas
31	
32	- **Frontend:** React + TypeScript + Vite
33	- **UI:** Tailwind CSS + Shadcn/ui
34	- **Backend:** Supabase (PostgreSQL)
35	- **Autenticação:** Sistema próprio com roles
36	- **Deploy:** Netlify/Vercel ready
37	
38	## 📦 Instalação
39	
40	### Pré-requisitos
41	- Node.js 18+ 
42	- npm ou pnpm
43	- Conta no Supabase (opcional)
44	
45	### Passos
46	
47	1. **Extrair o projeto:**
48	```bash
49	unzip biobox-sistema-completo.zip
50	cd BioBox
51	```
52	
53	2. **Instalar dependências:**
54	```bash
55	npm install
56	```
57	
58	3. **Configurar Supabase (opcional):**
59	   - Edite `client/lib/supabase.ts` com suas credenciais
60	   - Ou use o modo offline (dados em localStorage)
61	
62	4. **Executar em desenvolvimento:**
63	```bash
64	npm run dev
65	```
66	
67	5. **Gerar build de produção:**
68	```bash
69	npm run build
70	```
71	
72	## 🔐 Credenciais de Teste
73	
74	- **Administrador:** admin@bioboxsys.com / password
75	- **Vendedor Carlos:** carlos@bioboxsys.com / password
76	- **Vendedora Ana:** ana@bioboxsys.com / password
77	
78	## 📁 Estrutura do Projeto
79	
80	```
81	BioBox/
82	├── client/                 # Frontend React
83	│   ├── components/         # Componentes reutilizáveis
84	│   ├── pages/             # Páginas da aplicação
85	│   ├── hooks/             # Hooks personalizados
86	│   ├── lib/               # Configurações (Supabase)
87	│   └── types/             # Tipos TypeScript
88	├── server/                # Backend (opcional)
89	├── dist/                  # Build de produção
90	└── docs/                  # Documentação
91	```
92	
93	## 🎯 Principais Páginas
94	
95	### Dashboard (`/`)
96	- Métricas gerais do sistema
97	- Gráficos de produção
98	- Resumo de pedidos
99	
100	### Pedidos (`/orders`)
101	- Lista completa de pedidos
102	- Filtros por status e prioridade
103	- Criação de novos pedidos
104	- Rastreamento por vendedor
105	
106	### Clientes (`/customers`)
107	- Cadastro de clientes
108	- Histórico de pedidos
109	- Informações de contato
110	
111	### Produtos (`/products`)
112	- Catálogo de produtos
113	- Configurações de preços
114	- Opções de personalização
115	
116	### Produção (`/production`)
117	- Controle de tarefas
118	- Progresso de pedidos
119	- Gestão de operadores
120	
121	### Configurações (`/settings`)
122	- Gestão de usuários
123	- Permissões do sistema
124	- Configurações gerais
125	
126	## 🔧 Configuração do Supabase
127	
128	### Tabelas Necessárias:
129	- `users` - Usuários do sistema
130	- `customers` - Clientes
131	- `products` - Catálogo de produtos
132	- `orders` - Pedidos
133	- `order_products` - Produtos dos pedidos
134	- `production_tasks` - Tarefas de produção
135	
136	### Script SQL:
137	Execute o arquivo `biobox_database_setup.sql` no seu projeto Supabase.
138	
139	## 🚀 Deploy
140	
141	### Netlify/Vercel:
142	1. Faça build: `npm run build`
143	2. Deploy a pasta `dist/spa/`
144	
145	### Servidor Próprio:
146	1. Configure um servidor web (nginx/apache)
147	2. Aponte para `dist/spa/index.html`
148	
149	## 📱 Recursos Mobile
150	
151	- Interface totalmente responsiva
152	- Touch-friendly
153	- Navegação otimizada
154	- Formulários adaptados
155	
156	## 🎨 Personalização
157	
158	### Cores (Tailwind):
159	- Primary: `biobox-green` (#10B981)
160	- Backgrounds: Configuráveis via CSS
161	- Componentes: Shadcn/ui customizáveis
162	
163	### Funcionalidades:
164	- Adicione novos módulos em `client/pages/`
165	- Componentes reutilizáveis em `client/components/`
166	- Hooks personalizados em `client/hooks/`
167	
168	## 🐛 Solução de Problemas
169	
170	### Erro de Conexão Supabase:
171	- Verifique as credenciais em `client/lib/supabase.ts`
172	- Sistema funciona offline com dados mock
173	
174	### Erro de Build:
175	- Execute `npm install` novamente
176	- Verifique versão do Node.js (18+)
177	
178	### Problemas de Permissão:
179	- Verifique roles dos usuários
180	- Confirme configuração de RLS no Supabase
181	
182	## 📞 Suporte
183	
184	Para dúvidas ou problemas:
185	1. Verifique a documentação
186	2. Consulte os logs do console
187	3. Teste com dados mock primeiro
188	
189	## 📄 Licença
190	
191	Sistema desenvolvido para uso interno. Todos os direitos reservados.
192	
193	---
194	
195	**Desenvolvido com ❤️ para otimizar a gestão de produção de móveis**
196	
197	
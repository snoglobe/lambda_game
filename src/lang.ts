import {shoot, enemyIsAbove} from "./game";

interface LetBinding {
    name: string;
    value: AstNode;
}

interface Application {
    func: AstNode;
    arg: AstNode;

}

export type AstNode = ((value: AstNode) => AstNode) | number | LetBinding | Application | string;

enum TokenType {
    Number,
    LeftParen,
    RightParen,
    ID,
    Dot,
    Let,
    Backslash,
    EOF
}

type Token = {
    type: TokenType;
    value: string;
}

type Lexer = {
    input: string;
    nextToken: () => Token;
}

type Parser = {
    lexer: Lexer;
    parse: (inexpr: boolean) => AstNode;
    currentToken: Token;
}

const voidFunc: AstNode = (x: AstNode) => x;

const Env = {
// @ts-ignore
    'if': (x: AstNode) =>
            (y: AstNode) =>
                (z: AstNode) =>
                    // @ts-ignore
                    x(voidFunc) ?
                        // @ts-ignore
                        y(voidFunc) :
                            // @ts-ignore
                            z(voidFunc),
    'succ': (x: AstNode) => /* if it's a function, do successor of the church numeral; else return x + 1 */
        // @ts-ignore
        typeof x === 'function' ? (y: AstNode) => (z: AstNode) => y(voidFunc)(x(voidFunc)(y)(z)) : x + 1,
    'pred': (x: AstNode) => /* if it's a function, do predecessor of the church numeral; else return x - 1 */
        // @ts-ignore
        typeof x === 'function' ? (y: AstNode) => (z: AstNode) => x(voidFunc)((a: AstNode) => (b: AstNode) => b(a(y)))(voidFunc) : x - 1,
    'shoot': (x: AstNode) => {
            shoot();
        // @ts-ignore
        return voidFunc
    },

    'enemyIsAbove': (x: AstNode) =>
        // @ts-ignore
        enemyIsAbove() ? 1.0 : 0.0,
}

function TokenOf(type: TokenType, value: string): Token {
    return {
        type,
        value
    }
}

function Lexer(input: string): Lexer {
    let current = 0;
    const tokens: Token[] = [];

    while (input[current] !== undefined) {
        let char = input[current];

        if (char === '(') {
            tokens.push(TokenOf(TokenType.LeftParen, '('));
            current++;
            continue;
        }

        if (char === ')') {
            tokens.push(TokenOf(TokenType.RightParen, ')'));
            current++;
            continue;
        }

        if (char === '.') {
            tokens.push(TokenOf(TokenType.Dot, '.'));
            current++;
            continue;
        }

        if (char === ' ') {
            current++;
            continue;
        }

        if (char === 'l' && input[current + 1] === 'e' && input[current + 2] === 't') {
            tokens.push(TokenOf(TokenType.Let, 'let'));
            current += 3;
            continue;
        }

        if (char.match(/[0-9]/)) {
            let value = '';

            while (char.match(/[0-9]/)) {
                value += char;
                char = input[++current];
                if(char === undefined) break;
            }

            tokens.push(TokenOf(TokenType.Number, value));
            continue;
        }

        if (char.match(/[A-Za-z]/)) {
            let value = '';

            while (char.match(/[A-Za-z]/)) {
                value += char;
                char = input[++current];
                if(char === undefined) break;
            }

            tokens.push(TokenOf(TokenType.ID, value));
            continue;
        }

        if (char === '\\') {
            tokens.push(TokenOf(TokenType.Backslash, '\\'));
            current++;
            continue;
        }

        throw new Error(`Unrecognized token: ${char}`);
    }

    return {
        input,
        nextToken: () => {
            if (tokens.length === 0) {
                return TokenOf(TokenType.EOF, '\0');
            }

            const value = tokens.shift();
            //console.log(value);
            return value;
        }
    }
}

function Parser(lexer: Lexer): Parser {
    const currentToken = lexer.nextToken();
    const me: Parser = {lexer, parse: () => {return (x) => x}, currentToken};
    function peek(): TokenType {
        return me.currentToken.type;
    }
    function eat(type: TokenType): Token {
        if (me.currentToken.type === type) {
            const token = me.currentToken;
            me.currentToken = me.lexer.nextToken();
            return token;
        }

        throw new Error(`Unexpected token: ${me.currentToken.value}`);
    }
    me.parse = (inexpr: boolean = false) => {
        if (peek() === TokenType.Number) {
            const token = eat(TokenType.Number);
            // return church numeral
            return (f: AstNode) => (x: AstNode) => {
                let result = x;
                for (let i = 0; i < parseInt(token.value); i++) {
                    //@ts-ignore
                    result = f(result);
                }
                return result;
            }
        }

        if (peek() === TokenType.LeftParen) {
            eat(TokenType.LeftParen);
            // @ts-ignore
            const value = me.parse();
            eat(TokenType.RightParen);
            if(peek() !== TokenType.EOF && peek() !== TokenType.RightParen) {
                // @ts-ignore
                const arg = me.parse();
                let result = {func: value, arg} as Application;
                if(!inexpr)
                    while (peek() !== TokenType.RightParen && peek() !== TokenType.EOF && peek() !== TokenType.Let) {
                        result = {func: result, arg: me.parse(true)} as Application;
                    }
                return result;
            }
            return value;
        }

        if (peek() === TokenType.Let) {
            eat(TokenType.Let);
            const name = eat(TokenType.ID);
            eat(TokenType.Dot);
            // @ts-ignore
            const value = me.parse();
            return {name: name.value, value: value} as LetBinding;
        }

        if (peek() === TokenType.ID) {
            const name = eat(TokenType.ID);
            if(peek() == TokenType.RightParen) return name.value;
            // @ts-ignore
            const arg = me.parse();
            let result = {func: name.value, arg} as Application;
            while (peek() !== TokenType.RightParen && peek() !== TokenType.EOF && peek() !== TokenType.Let) {
                // @ts-ignore
                result = {func: result, arg: me.parse()} as Application;
            }
            return result;
        }

        if (peek() === TokenType.Backslash) {
            eat(TokenType.Backslash);
            const name = eat(TokenType.ID);
            eat(TokenType.Dot);
            // @ts-ignore
            const value = me.parse();
            return (x) => {
                Env[name.value] = x;
                const result = langEval(value);
                delete Env[name.value];
                return result;
            };
        }

        throw new Error(`Unexpected token: ${me.currentToken.value} of type ${me.currentToken.type}`);
    }
    return me;
}

function langEval(node: AstNode): AstNode {
    if (typeof node === 'number') {
        return node;
    }

    if (typeof node === 'function') {
        return node;
    }

    if (typeof node === 'string') {
        return Env[node];
    }

    if (typeof node === 'object') {
        if (node.hasOwnProperty('name')) {
            const binding = node as LetBinding;
            Env[binding.name] = langEval(binding.value);
            return Env[binding.name];
        }

        if (node.hasOwnProperty('arg')) {
            const application = node as Application;
            const func = langEval(application.func);
            // @ts-ignore
            return langEval(func(langEval(application.arg)));
        }
    }

    throw new Error(`Unrecognized node: ${node}`);
}

export function interpret(input) {
    const lexer = Lexer(input);
    const parser = Parser(lexer);
    const ast = parser.parse(false);
    const out = langEval(ast);
    return out;
}

// test
//const input = 'if \\condition.0 \\then.1 \\else.2';
//console.log(interpret(input))
import React, { Component } from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';

const styles = StyleSheet.create({
    padding: 50,
});

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = { text: '' };
    }

    render() {
        const { text } = this.state;

        return (
            <View style={styles}>
                <TextInput
                    style={{ height: 40, borderColor: 'black', borderRadius: 5 }}
                    placeholder="Type here to translate!"
                    onChangeText={(theText) => this.setState({ text: theText })}
                />
                <Text style={{ padding: 10, fontSize: 42 }}>
                    {text.split(' ').map((word) => word && '🍕').join(' ')}
                </Text>
            </View>
        );
    }
}

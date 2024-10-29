import styled from "styled-components";

export const HeaderContainer = styled.header`
display: flex;
justify-content: space-between;
padding: 0 10rem;
margin: 2rem 0;
`

export const HeaderLocationCart = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    width: 16rem;

`

export const HeaderDescriptionLocation = styled.p`
    background-color: ${(props) => props.theme['purple-light']};
    color: ${(props) => props.theme['purple-dark']};
    border-radius: 8px;
    padding: 1rem;

    &::before{
        content: url("/src/assets/location-pin.svg");
        position: relative;
        top: 5px;
        right: 4px;
    }
`

export const HeaderCart = styled.img`
    background-color: ${(props) => props.theme['yellow-light']};
    border-radius: 8px;

    padding: 1rem;
    margin-left: 1rem;

    height: 22px;
    width: 22px;

`
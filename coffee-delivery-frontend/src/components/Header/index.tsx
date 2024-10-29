import {
  HeaderCart,
  HeaderContainer,
  HeaderDescriptionLocation,
  HeaderLocationCart,
} from "./styles";

export default function Header() {
  return (
    <HeaderContainer>
      <img src="/src/assets/logo.svg" alt="Logo Coffee Delivery" />
      <HeaderLocationCart>
        <HeaderDescriptionLocation>Porto Alegre, RS</HeaderDescriptionLocation>
        <HeaderCart src="/src/assets/cart-icon.svg" alt="Icon to access Cart" />
      </HeaderLocationCart>
    </HeaderContainer>
  );
}
